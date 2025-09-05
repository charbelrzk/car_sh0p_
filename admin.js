const STORAGE_KEY = 'carshop_cars';

function loadCarsFromStorage() {
	try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveCarsToStorage(cars) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
}

async function loadCars() {
	const tableBody = document.querySelector('#carsTable tbody');
	const data = loadCarsFromStorage();
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
	const cars = loadCarsFromStorage();
	const i = cars.findIndex(c => c.id === id);
	if (i !== -1) cars[i] = { ...cars[i], ...payload };

	// Enforce max 3 featured
	const featuredIds = cars.filter(c => c.featured).map(c => c.id);
	if (featuredIds.length > 3) {
		// Uncheck the oldest featured beyond 3
		const toUncheck = featuredIds.slice(0, featuredIds.length - 3);
		for (const fid of toUncheck) {
			const idx = cars.findIndex(c => c.id === fid);
			if (idx !== -1) cars[idx].featured = false;
		}
	}
	saveCarsToStorage(cars);
	await loadCars();
}

async function onDelete(e) {
	const tr = e.target.closest('tr');
	const id = tr.getAttribute('data-id');
	if (!confirm('Delete this car?')) return;
	const cars = loadCarsFromStorage().filter(c => c.id !== id);
	saveCarsToStorage(cars);
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
	payload.id = crypto.randomUUID();
	payload.year = Number(payload.year);
	payload.price = Number(payload.price);
	payload.mileage = Number(payload.mileage);
	payload.createdAt = new Date().toISOString();
	const urlImages = payload.images ? payload.images.split(',').map(s => s.trim()).filter(Boolean) : [];
	payload.images = [...urlImages, ...fileImages].slice(0, 10);
	const cars = loadCarsFromStorage();
	cars.unshift(payload);
	saveCarsToStorage(cars);
	e.target.reset();
	await loadCars();
});

loadCars();

