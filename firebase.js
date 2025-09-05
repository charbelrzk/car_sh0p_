// Firebase client helpers for Car Shop
// Fill in window.FIREBASE_CONFIG with your Firebase project config before use.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut as fbSignOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, collection, doc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, arrayUnion, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js';

const config = {
    apiKey: "AIzaSyC87832Gxt03UlZOSbxoU46hkKqF-Pvpkc",
    authDomain: "car--shop.firebaseapp.com",
    projectId: "car--shop",
    storageBucket: "car--shop.firebasestorage.app",
    messagingSenderId: "385403019174",
    appId: "1:385403019174:web:c8a2c5a635d2bbbf0fb967",
    measurementId: "G-B9KZCXJVK9"
};

console.log('Firebase config:', config);

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, 'cars');
const storage = getStorage(app);

console.log('Firebase initialized:', { app, auth, db, storage });

// Collections
const carsCol = collection(db, 'cars');
const leadsCol = collection(db, 'leads');

// Public: list cars (ordered newest first)
export async function listCars() {
    const qy = query(carsCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Public: create lead
export async function createLead(payload) {
    const docData = {
        carId: payload.carId || null,
        name: payload.name,
        email: payload.email,
        phone: payload.phone || null,
        message: payload.message || null,
        createdAt: serverTimestamp()
    };
    const ref = await addDoc(leadsCol, docData);
    return { ok: true, id: ref.id };
}

// Admin: auth
export async function signIn(email, password) {
    console.log('Attempting to sign in with:', email);
    console.log('Auth object:', auth);
    
    if (!auth) {
        throw new Error('Firebase Auth not initialized');
    }
    
    try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        console.log('Sign in successful:', res);
        console.log('User object:', res.user);
        return res.user;
    } catch (error) {
        console.error('Firebase Auth Error:', error);
        throw error;
    }
}

export async function signOut() { return fbSignOut(auth); }

// Admin: create/update/delete cars
export async function createCar(car, files = { thumbnailFile: null, galleryFiles: [] }) {
    console.log('createCar called with:', { car, files });
    
    try {
        // Ensure user is authenticated before proceeding
        if (!auth.currentUser) {
            throw new Error('User must be authenticated to create cars');
        }
        
        console.log('User authenticated:', auth.currentUser.uid);
        
        const toCreate = { ...car };
        if (!toCreate.createdAt) toCreate.createdAt = serverTimestamp();
        if (!toCreate.images) toCreate.images = [];

        console.log('Car data to create:', toCreate);

        // Upload files if provided
        if (files && files.thumbnailFile) {
            console.log('Uploading thumbnail file...');
            const url = await uploadImage(files.thumbnailFile, `thumbnails/${Date.now()}_${files.thumbnailFile.name}`);
            toCreate.thumbnail = url;
        }
        if (files && files.galleryFiles && files.galleryFiles.length) {
            console.log('Uploading gallery files...');
            for (const file of files.galleryFiles) {
                const url = await uploadImage(file, `gallery/${Date.now()}_${file.name}`);
                toCreate.images.push(url);
            }
        }

        console.log('Saving to Firestore...');
        const ref = await addDoc(carsCol, toCreate);
        console.log('Car saved with ID:', ref.id);
        
        return { id: ref.id, ...toCreate };
    } catch (error) {
        console.error('Error in createCar:', error);
        throw error;
    }
}

export async function updateCar(id, updates) {
    if (!auth.currentUser) {
        throw new Error('User must be authenticated to update cars');
    }
    const ref = doc(db, 'cars', id);
    await setDoc(ref, updates, { merge: true });
}

export async function removeCar(id) {
    if (!auth.currentUser) {
        throw new Error('User must be authenticated to remove cars');
    }
    const ref = doc(db, 'cars', id);
    await deleteDoc(ref);
}

export async function addImageToCar(id, fileOrUrl) {
    if (!auth.currentUser) {
        throw new Error('User must be authenticated to add images to cars');
    }
    const refDoc = doc(db, 'cars', id);
    let url = null;
    if (typeof fileOrUrl === 'string') {
        url = fileOrUrl;
    } else if (fileOrUrl && fileOrUrl.name) {
        url = await uploadImage(fileOrUrl, `gallery/${Date.now()}_${fileOrUrl.name}`);
    }
    if (!url) return null;
    await updateDoc(refDoc, { images: arrayUnion(url) });
    return url;
}

async function uploadImage(file, path) {
    const ref = storageRef(storage, path);
    await uploadBytes(ref, file);
    return getDownloadURL(ref);
}

// Also expose globally for non-module scripts if needed
window.carshop = Object.assign(window.carshop || {}, {
    listCars,
    createLead,
    signIn,
    signOut,
    createCar,
    updateCar,
    removeCar,
    addImageToCar
});


