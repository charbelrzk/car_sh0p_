import { signIn, listCars, createCar, updateCar, removeCar } from './firebase.js';

(function(){
    const tableBody = document.querySelector('#carsTable tbody');
    const createForm = document.getElementById('createForm');
    const thumbFile = document.getElementById('thumbFile');
    const galleryFiles = document.getElementById('galleryFiles');

    async function refresh() {
        const cars = await listCars();
        renderRows(cars);
    }

    function renderRows(cars) {
        if (!tableBody) return;
        tableBody.innerHTML = cars.map(c => `
            <tr data-id="${c.id}">
                <td>
                    <div style="display:grid;gap:6px">
                        <input class="edit" data-k="make" value="${c.make || ''}" />
                        <input class="edit" data-k="model" value="${c.model || ''}" />
                        <input class="edit" data-k="year" type="number" value="${c.year || ''}" />
                    </div>
                </td>
                <td><input class="edit" data-k="price" type="number" value="${c.price || ''}" /></td>
                <td><input class="edit" data-k="mileage" type="number" value="${c.mileage || ''}" /></td>
                <td><input class="edit" data-k="featured" type="checkbox" ${c.featured ? 'checked' : ''} /></td>
                <td class="admin-actions">
                    <button class="save">Save</button>
                    <button class="delete">Delete</button>
                </td>
            </tr>
        `).join('');

        tableBody.querySelectorAll('.save').forEach(btn => btn.addEventListener('click', onSave));
        tableBody.querySelectorAll('.delete').forEach(btn => btn.addEventListener('click', onDelete));
    }

    async function onSave(e) {
        const tr = e.target.closest('tr');
        const id = tr.getAttribute('data-id');
        const edits = {};
        tr.querySelectorAll('.edit').forEach(input => {
            const key = input.getAttribute('data-k');
            let val = input.type === 'checkbox' ? input.checked : input.value;
            if (input.type === 'number' && input.value !== '') val = Number(input.value);
            edits[key] = val;
        });
        // Enforce at most 3 featured vehicles
        if (edits.featured) {
            const all = await listCars();
            const featured = all.filter(c => c.featured && c.id !== id);
            if (featured.length >= 3) {
                alert('You can only feature up to 3 cars. Uncheck another first.');
                return;
            }
        }
        await updateCar(id, edits);
        await refresh();
    }

    async function onDelete(e) {
        const tr = e.target.closest('tr');
        const id = tr.getAttribute('data-id');
        if (!confirm('Delete this car?')) return;
        await removeCar(id);
        await refresh();
    }

    if (createForm) createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Creating car...');
        
        try {
            const fd = new FormData(createForm);
            const imagesCsv = String(fd.get('images') || '').split(',').map(s => s.trim()).filter(Boolean);
            const payload = {
                make: fd.get('make'),
                model: fd.get('model'),
                year: Number(fd.get('year')),
                price: Number(fd.get('price')),
                mileage: Number(fd.get('mileage')),
                body: String(fd.get('body') || ''),
                color: String(fd.get('color') || ''),
                thumbnail: String(fd.get('thumbnail') || ''),
                images: imagesCsv,
                featured: false
            };
            
            console.log('Car payload:', payload);
            
            const files = {
                thumbnailFile: thumbFile && thumbFile.files && thumbFile.files[0] ? thumbFile.files[0] : null,
                galleryFiles: galleryFiles && galleryFiles.files ? Array.from(galleryFiles.files) : []
            };
            
            console.log('Files:', files);
            
            const result = await createCar(payload, files);
            console.log('Car created successfully:', result);
            
            createForm.reset();
            await refresh();
            
            // Show success message
            alert('Car created successfully!');
            
        } catch (error) {
            console.error('Error creating car:', error);
            alert('Error creating car: ' + error.message);
        }
    });

    // initial load after admin.html auth gate
    document.addEventListener('DOMContentLoaded', refresh);
})();

