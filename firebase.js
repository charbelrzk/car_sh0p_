// Firebase bootstrap and tiny data helpers for this static site
// Uses CDN modules so it works on GitHub Pages without a build step

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, addDoc, deleteDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export const ADMIN_UID = "6sd9M6IX0HbSbMpH9vNJ2kdnIkQ2";

const firebaseConfig = {
	apiKey: "AIzaSyC87832Gxt03UlZOSbxoU46hkKqF-Pvpkc",
	authDomain: "car--shop.firebaseapp.com",
	projectId: "car--shop",
	storageBucket: "car--shop.firebasestorage.app",
	messagingSenderId: "385403019174",
	appId: "1:385403019174:web:c8a2c5a635d2bbbf0fb967",
	measurementId: "G-B9KZCXJVK9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth helpers
export async function signIn(email, password) {
	const res = await signInWithEmailAndPassword(auth, email, password);
	if (res.user.uid !== ADMIN_UID) {
		await signOut(auth);
		throw new Error("Not authorized admin UID");
	}
	return res.user;
}

// Cars CRUD
export async function listCars() {
	const snap = await getDocs(collection(db, 'cars'));
	return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getCar(id) {
	const d = await getDoc(doc(db, 'cars', id));
	return d.exists() ? ({ id: d.id, ...d.data() }) : null;
}

export async function createCar(car) {
	const toWrite = { ...car };
	if (!toWrite.createdAt) toWrite.createdAt = serverTimestamp();
	if (toWrite.id) {
		const id = toWrite.id; delete toWrite.id;
		await setDoc(doc(db, 'cars', id), toWrite, { merge: true });
		return id;
	}
	const ref = await addDoc(collection(db, 'cars'), toWrite);
	return ref.id;
}

export async function updateCar(id, fields) {
	await updateDoc(doc(db, 'cars', id), fields);
}

export async function removeCar(id) {
	await deleteDoc(doc(db, 'cars', id));
}

// Leads
export async function createLead(lead) {
	const toWrite = { ...lead, createdAt: serverTimestamp() };
	await addDoc(collection(db, 'leads'), toWrite);
}


