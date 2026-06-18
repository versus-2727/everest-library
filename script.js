// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyB6Vqp9XsYArRr18nL48oOesebVUKzVx8Q",
  authDomain: "likes-3258b.firebaseapp.com",
  projectId: "likes-3258b",
  storageBucket: "likes-3258b.firebasestorage.app",
  messagingSenderId: "149436312657",
  appId: "1:149436312657:web:803cbfc7f17d26a54fdc70",
  measurementId: "G-ER2Q0K216H"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
} catch (e) {
    console.log("Firebase already initialized");
}

const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let authReady = false;

// --- AUTH ---
function initAuth() {
    // Проверяем, есть ли сохраненный UID
    let savedUid = localStorage.getItem('everest_user_uid');
    
    if (!savedUid) {
        // Создаем уникальный ID для пользователя
        savedUid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('everest_user_uid', savedUid);
    }
    
    // Пытаемся анонимный вход
    auth.signInAnonymously()
        .then((userCredential) => {
            currentUser = userCredential.user;
            authReady = true;
            console.log("Auth success:", currentUser.uid);
            loadAllLikes();
        })
        .catch((error) => {
            console.error("Auth error:", error);
            // Если анонимный вход не работает, используем localStorage ID
            currentUser = { uid: savedUid };
            authReady = true;
            console.log("Using localStorage ID:", currentUser.uid);
            loadAllLikes();
        });
    
    // Следим за состоянием авторизации
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            authReady = true;
            loadAllLikes();
        }
    });
    
    // Таймаут на случай если авторизация зависла
    setTimeout(() => {
        if (!authReady) {
            currentUser = { uid: savedUid };
            authReady = true;
            console.log("Auth timeout, using localStorage ID");
            loadAllLikes();
        }
    }, 5000);
}

// --- LIKE SYSTEM ---
async function handleLike(event, videoId) {
    event.stopPropagation();
    
    if (!authReady) {
        alert("Пожалуйста, подождите 2-3 секунды и попробуйте снова");
        return;
    }
    
    if (!currentUser) {
        alert("Ошибка авторизации. Обновите страницу.");
        return;
    }

    const btn = event.currentTarget;
    const isLiked = btn.classList.contains('liked');
    const userId = currentUser.uid;

    try {
        if (isLiked) {
            // Убираем лайк
            const likeRef = db.collection('likes').doc(`${userId}_${videoId}`);
            await likeRef.delete();
            
            const videoRef = db.collection('videos').doc(videoId);
            await videoRef.update({ count: firebase.firestore.FieldValue.increment(-1) });
            
            updateButtonUI(btn, false);
        } else {
            // Ставим лайк
            const likeRef = db.collection('likes').doc(`${userId}_${videoId}`);
            await likeRef.set({
                userId: userId,
                videoId: videoId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            const videoRef = db.collection('videos').doc(videoId);
            await videoRef.set({ count: firebase.firestore.FieldValue.increment(1) }, { merge: true });
            
            updateButtonUI(btn, true);
        }
    } catch (error) {
        console.error("Error updating like:", error);
        alert("Ошибка: " + error.message);
    }
}

function updateButtonUI(btn, liked) {
    const countSpan = btn.querySelector('.like-count');
    let currentCount = parseInt(countSpan.innerText) || 0;

    if (liked) {
        btn.classList.add('liked');
        countSpan.innerText = currentCount + 1;
    } else {
        btn.classList.remove('liked');
        countSpan.innerText = Math.max(0, currentCount - 1);
    }
}

function loadAllLikes() {
    if (!authReady || !currentUser) return;
    
    const userId = currentUser.uid;

    // Load counts - слушаем изменения в реальном времени
    db.collection('videos').onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const videoId = change.doc.id;
            const count = data.count || 0;
            
            const btn = document.querySelector(`.like-btn[data-id="${videoId}"]`);
            if (btn) {
                const countSpan = btn.querySelector('.like-count');
                // Если кнопка уже лайкнута, не меняем число (оно уже увеличено визуально)
                if (!btn.classList.contains('liked')) {
                    countSpan.innerText = count;
                }
            }
        });
    }, (error) => {
        console.error("Error loading videos:", error);
    });

    // Load user likes
    db.collection('likes').where('userId', '==', userId).get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const videoId = doc.data().videoId;
                const btn = document.querySelector(`.like-btn[data-id="${videoId}"]`);
                if (btn) {
                    btn.classList.add('liked');
                    // Обновляем счетчик для лайкнутых видео
                    const countSpan = btn.querySelector('.like-count');
                    const currentCount = parseInt(countSpan.innerText) || 0;
                    countSpan.innerText = currentCount + 1;
                }
            });
        })
        .catch((error) => {
            console.error("Error loading user likes:", error);
        });
}

// --- YOUR EXISTING CODE ---
function showPage(id) {
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    const page = document.getElementById(id);
    if (page) page.classList.add("active");
    if (id !== "video") resetVideoSection();
}

function showVideoTab(tabId) {
    document.querySelectorAll(".video-tab").forEach((tab) => tab.style.display = "none");
    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.style.display = "block";
}

function openInterviewSection() {
    const sections = document.getElementById("video-section-grid");
    const tabs = document.getElementById("video-tabs");
    const list = document.getElementById("interview-list");
    const player = document.getElementById("interview-player");
    if (!sections || !tabs || !list || !player) return;
    stopAllInterviewVideos();
    sections.classList.add("hidden");
    tabs.classList.add("hidden");
    list.classList.remove("hidden");
    player.classList.add("hidden");
    document.querySelectorAll(".interview-video").forEach((block) => block.classList.add("hidden"));
}

function openInterviewVideo(id) {
    const list = document.getElementById("interview-list");
    const player = document.getElementById("interview-player");
    if (!list || !player) return;
    stopAllInterviewVideos();
    list.classList.add("hidden");
    player.classList.remove("hidden");
    document.querySelectorAll(".interview-video").forEach((block) => block.classList.add("hidden"));
    const target = document.getElementById("interview-" + id);
    if (target) target.classList.remove("hidden");
}

function backToInterviewList() {
    const list = document.getElementById("interview-list");
    const player = document.getElementById("interview-player");
    if (!list || !player) return;
    stopAllInterviewVideos();
    player.classList.add("hidden");
    list.classList.remove("hidden");
    document.querySelectorAll(".interview-video").forEach((block) => block.classList.add("hidden"));
}

function backToVideoSections() {
    resetVideoSection();
}

function resetVideoSection() {
    const sections = document.getElementById("video-section-grid");
    const tabs = document.getElementById("video-tabs");
    const list = document.getElementById("interview-list");
    const player = document.getElementById("interview-player");
    if (sections) sections.classList.remove("hidden");
    if (tabs) {
        tabs.classList.remove("hidden");
        tabs.querySelectorAll(".video-tab").forEach((tab) => tab.style.display = "none");
    }
    if (list) list.classList.add("hidden");
    if (player) {
        player.classList.add("hidden");
        player.querySelectorAll(".interview-video").forEach((block) => block.classList.add("hidden"));
    }
    stopAllInterviewVideos();
}

function stopAllInterviewVideos() {
    document.querySelectorAll("#interview-player .video-container").forEach((container) => {
        container.classList.remove("started");
        const iframe = container.querySelector("iframe");
        if (iframe) iframe.removeAttribute("src");
    });
}

function startInterviewVideo(id) {
    const wrapper = document.getElementById("interview-" + id);
    if (!wrapper) return;
    const container = wrapper.querySelector(".video-container");
    const iframe = container ? container.querySelector("iframe") : null;
    if (!container || !iframe) return;
    if (!iframe.src) {
        const baseSrc = iframe.dataset.src;
        if (baseSrc) {
            const url = baseSrc.includes("?") ? baseSrc + "&autoplay=1" : baseSrc + "?autoplay=1";
            iframe.src = url;
        }
    }
    container.classList.add("started");
}

// Feedback form
document.addEventListener("DOMContentLoaded", () => {
    initAuth();
    
    const feedbackForm = document.getElementById("feedbackForm");
    if (!feedbackForm) return;
    feedbackForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const name = document.getElementById("name").value;
        const email = document.getElementById("userEmail").value;
        const message = document.getElementById("message").value;
        fetch("https://formspree.io/f/xojnjpkk", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ name, email, message, _replyto: email, _subject: "Сообщение с сайта Эверест" }),
        })
        .then((response) => {
            const status = document.getElementById("status");
            if (!status) return;
            if (response.ok) {
                status.innerText = "Сообщение отправлено!";
                this.reset();
            } else {
                status.innerText = "Ошибка отправки. Попробуйте ещё раз.";
            }
        })
        .catch((error) => {
            const status = document.getElementById("status");
            if (status) status.innerText = "Ошибка отправки. Проверьте интернет.";
            console.error(error);
        });
    });
});
