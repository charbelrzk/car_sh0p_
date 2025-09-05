import { listCars, createCar, updateCar, removeCar } from './firebase.js';

async function loadCars() {
	const tableBody = document.querySelector('#carsTable tbody');
	const data = await listCars();
	tableBody.innerHTML = data.map(car => `
		<tr data-id="${car.id}">
			<td>
				<strong>${car.year} ${car.make} ${car.model}</strong><br/>
				<input class="e-make" value="${car.make}"> <input class="e-model" value="${car.model}"> <input class="e-year" type="number" value="${car.year}"><br/>
				<input class="e-body" value="${car.body || ''}"> <input class="e-color" value="${car.color || ''}"><br/>
				<input class="e-thumb" value="${car.thumbnail || ''}" placeholder="Thumbnail URL">
			</td>
			<td>
				<input class="e-price" type="number" value="${car.price}">
			</td>
			<td>
				<input class="e-mileage" type="number" value="${car.mileage}">
			</td>
			<td style="text-align:center">
				<input class="e-featured" type="checkbox" ${car.featured ? 'checked' : ''}>
			</td>
			<td class="admin-actions">
				<button class="save">Save</button>
				<button class="delete">Delete</button>
			</td>
		</tr>
	`).join('');

	Array.from(document.querySelectorAll('button.save')).forEach(btn => btn.addEventListener('click', onSave));
	Array.from(document.querySelectorAll('button.delete')).forEach(btn => btn.addEventListener('click', onDelete));
}

async function onSave(e) {
	const tr = e.target.closest('tr');
	const id = tr.getAttribute('data-id');
	const payload = {
		make: tr.querySelector('.e-make').value.trim(),
		model: tr.querySelector('.e-model').value.trim(),
		year: Number(tr.querySelector('.e-year').value),
		price: Number(tr.querySelector('.e-price').value),
		mileage: Number(tr.querySelector('.e-mileage').value),
		body: tr.querySelector('.e-body').value.trim(),
		color: tr.querySelector('.e-color').value.trim(),
		thumbnail: tr.querySelector('.e-thumb').value.trim(),
		featured: tr.querySelector('.e-featured').checked
	};
	await updateCar(id, payload);
	await loadCars();
}

async function onDelete(e) {
	const tr = e.target.closest('tr');
	const id = tr.getAttribute('data-id');
	if (!confirm('Delete this car?')) return;
	await removeCar(id);
	await loadCars();
}

document.getElementById('createForm').addEventListener('submit', async (e) => {
	e.preventDefault();
	const fd = new FormData(e.target);
	const payload = Object.fromEntries(fd.entries());

	// Inline thumbnail from file if provided
	const thumbFileInput = document.getElementById('thumbFile');
	if (thumbFileInput && thumbFileInput.files && thumbFileInput.files[0]) {
		const file = thumbFileInput.files[0];
		const dataUrl = await new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.readAsDataURL(file);
		});
		payload.thumbnail = dataUrl;
	}

	// Inline gallery images from files (up to 10 total images)
	const galleryFiles = document.getElementById('galleryFiles');
	const fileImages = [];
	if (galleryFiles && galleryFiles.files && galleryFiles.files.length) {
		const readOne = (file) => new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.readAsDataURL(file);
		});
		for (let i = 0; i < Math.min(10, galleryFiles.files.length); i++) {
			const dataUrl = await readOne(galleryFiles.files[i]);
			fileImages.push(dataUrl);
		}
	}
	payload.year = Number(payload.year);
	payload.price = Number(payload.price);
	payload.mileage = Number(payload.mileage);
	const urlImages = payload.images ? payload.images.split(',').map(s => s.trim()).filter(Boolean) : [];
	payload.images = [...urlImages, ...fileImages].slice(0, 10);
	await createCar(payload);
	e.target.reset();
	await loadCars();
});

loadCars();

