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
                        <strong>${c.make || ''} ${c.model || ''}</strong>
                        <span style="color:#9aa3b2;font-size:14px">${c.year || ''} • ${c.body || ''} • ${c.color || ''}</span>
                    </div>
			</td>
                <td><strong>$${c.price ? c.price.toLocaleString() : '0'}</strong></td>
                <td>${c.mileage ? c.mileage.toLocaleString() : '0'} mi</td>
                <td>${c.featured ? '⭐ Featured' : 'Regular'}</td>
			<td class="admin-actions">
                    <button class="edit-btn" style="background:#3b82f6;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;margin-right:5px;">Edit</button>
                    <button class="delete" style="background:#dc2626;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">Delete</button>
			</td>
		</tr>
	`).join('');

        tableBody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', onEdit));
        tableBody.querySelectorAll('.delete').forEach(btn => btn.addEventListener('click', onDelete));
    }

    // Edit modal functionality
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const closeEditModal = document.getElementById('closeEditModal');
    const cancelEdit = document.getElementById('cancelEdit');

    function showEditModal() {
        if (editModal) editModal.style.display = 'flex';
    }

    function hideEditModal() {
        if (editModal) editModal.style.display = 'none';
    }

    async function onEdit(e) {
	const tr = e.target.closest('tr');
	const id = tr.getAttribute('data-id');
        
        try {
            const cars = await listCars();
            const car = cars.find(c => c.id === id);
            if (!car) {
                alert('Car not found');
                return;
            }

            // Populate edit form with car data
            document.getElementById('editCarId').value = car.id;
            document.getElementById('editMake').value = car.make || '';
            document.getElementById('editModel').value = car.model || '';
            document.getElementById('editYear').value = car.year || '';
            document.getElementById('editPrice').value = car.price || '';
            document.getElementById('editMileage').value = car.mileage || '';
            document.getElementById('editBody').value = car.body || '';
            document.getElementById('editColor').value = car.color || '';
            document.getElementById('editVin').value = car.vin || '';
            document.getElementById('editEngine').value = car.engine || '';
            document.getElementById('editTransmission').value = car.transmission || '';
            document.getElementById('editFuelType').value = car.fuelType || '';
            document.getElementById('editDescription').value = car.description || '';
            document.getElementById('editThumbnail').value = car.thumbnail || '';
            
            // Populate individual image fields
            const images = Array.isArray(car.images) ? car.images : [];
            for (let i = 1; i <= 5; i++) {
                const imageField = document.getElementById(`editImage${i}`);
                if (imageField) {
                    imageField.value = images[i - 1] || '';
                }
            }
            
            document.getElementById('editFeatured').checked = car.featured || false;

            showEditModal();
        } catch (error) {
            console.error('Error loading car for edit:', error);
            alert('Error loading car details: ' + error.message);
        }
}

async function onDelete(e) {
	const tr = e.target.closest('tr');
	const id = tr.getAttribute('data-id');
	if (!confirm('Delete this car?')) return;
	await removeCar(id);
        await refresh();
}

    // Edit form submission
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Updating car...');
            
            try {
                const carId = document.getElementById('editCarId').value;
                const fd = new FormData(editForm);
                
                // Collect individual image URLs
                const imageUrls = [];
                for (let i = 1; i <= 5; i++) {
                    const url = fd.get(`image${i}`);
                    if (url && url.trim()) {
                        imageUrls.push(url.trim());
                    }
                }
                
                const updates = {
                    make: fd.get('make'),
                    model: fd.get('model'),
                    year: Number(fd.get('year')),
                    price: Number(fd.get('price')),
                    mileage: Number(fd.get('mileage')),
                    body: String(fd.get('body') || ''),
                    color: String(fd.get('color') || ''),
                    vin: String(fd.get('vin') || ''),
                    engine: String(fd.get('engine') || ''),
                    transmission: String(fd.get('transmission') || ''),
                    fuelType: String(fd.get('fuelType') || ''),
                    description: String(fd.get('description') || ''),
                    thumbnail: String(fd.get('thumbnail') || ''),
                    images: imageUrls,
                    featured: fd.get('featured') === 'on'
                };
                
                // Enforce at most 3 featured vehicles
                if (updates.featured) {
                    const all = await listCars();
                    const featured = all.filter(c => c.featured && c.id !== carId);
                    if (featured.length >= 3) {
                        alert('You can only feature up to 3 cars. Uncheck another first.');
                        return;
                    }
                }
                
                console.log('Car updates:', updates);
                
                await updateCar(carId, updates);
                console.log('Car updated successfully');
                
                hideEditModal();
                await refresh();
                
                // Show success message
                alert('Car updated successfully!');
                
            } catch (error) {
                console.error('Error updating car:', error);
                alert('Error updating car: ' + error.message);
            }
        });
    }

    // Modal event listeners
    if (closeEditModal) {
        closeEditModal.addEventListener('click', hideEditModal);
    }
    
    if (cancelEdit) {
        cancelEdit.addEventListener('click', hideEditModal);
    }
    
    // Close modal when clicking outside
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                hideEditModal();
            }
        });
    }

    if (createForm) createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Creating car...');
        
        try {
            const fd = new FormData(createForm);
            
            // Collect individual image URLs
            const imageUrls = [];
            for (let i = 1; i <= 5; i++) {
                const url = fd.get(`image${i}`);
                if (url && url.trim()) {
                    imageUrls.push(url.trim());
                }
            }
            
            const payload = {
                make: fd.get('make'),
                model: fd.get('model'),
                year: Number(fd.get('year')),
                price: Number(fd.get('price')),
                mileage: Number(fd.get('mileage')),
                body: String(fd.get('body') || ''),
                color: String(fd.get('color') || ''),
                vin: String(fd.get('vin') || ''),
                engine: String(fd.get('engine') || ''),
                transmission: String(fd.get('transmission') || ''),
                fuelType: String(fd.get('fuelType') || ''),
                description: String(fd.get('description') || ''),
                thumbnail: String(fd.get('thumbnail') || ''),
                images: imageUrls,
                featured: false
            };
            
            console.log('Car payload:', payload);
            
            // Collect file uploads
            const files = {
                thumbnailFile: thumbFile && thumbFile.files && thumbFile.files[0] ? thumbFile.files[0] : null,
                galleryFiles: []
            };
            
            // Add gallery files
            for (let i = 1; i <= 5; i++) {
                const fileInput = document.getElementById(`galleryFile${i}`);
                if (fileInput && fileInput.files && fileInput.files[0]) {
                    files.galleryFiles.push(fileInput.files[0]);
                }
            }
            
            console.log('Files:', files);
            
            const result = await createCar(payload, files);
            console.log('Car created successfully:', result);
            
            createForm.reset();
            await refresh();
            
            // Show success message
            alert('Car created successfully!');
            
        } catch (error) {
            console.error('Error creating car:', error);
            let errorMessage = 'Error creating car: ' + error.message;
            
            // Provide specific error messages for common issues
            if (error.code === 'storage/unauthorized') {
                errorMessage = 'Image upload failed: You need to configure Firebase Storage rules to allow authenticated users to upload files.';
            } else if (error.code === 'storage/object-not-found') {
                errorMessage = 'Image upload failed: Storage bucket not found. Check your Firebase configuration.';
            } else if (error.code === 'storage/quota-exceeded') {
                errorMessage = 'Image upload failed: Storage quota exceeded.';
            } else if (error.message.includes('storage')) {
                errorMessage = 'Image upload failed: ' + error.message + '. Check Firebase Storage configuration.';
            }
            
            alert(errorMessage);
        }
    });

    // initial load after admin.html auth gate
    document.addEventListener('DOMContentLoaded', refresh);
})();

