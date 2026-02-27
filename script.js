function showPage(id) {
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    const page = document.getElementById(id);
    if (page) {
        page.classList.add("active");
    }

    if (id !== "video") {
        resetVideoSection();
    }
}

function showVideoTab(tabId) {
    document.querySelectorAll(".video-tab").forEach((tab) => {
        tab.style.display = "none";
    });
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.style.display = "block";
    }
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

    // Сбрасываем активные видео
    document.querySelectorAll(".interview-video").forEach((block) => {
        block.classList.add("hidden");
    });
}

function openInterviewVideo(id) {
    const list = document.getElementById("interview-list");
    const player = document.getElementById("interview-player");
    if (!list || !player) return;

    stopAllInterviewVideos();

    list.classList.add("hidden");
    player.classList.remove("hidden");

    document.querySelectorAll(".interview-video").forEach((block) => {
        block.classList.add("hidden");
    });

    const target = document.getElementById("interview-" + id);
    if (target) {
        target.classList.remove("hidden");
    }
}

function backToInterviewList() {
    const list = document.getElementById("interview-list");
    const player = document.getElementById("interview-player");
    if (!list || !player) return;

    stopAllInterviewVideos();

    player.classList.add("hidden");
    list.classList.remove("hidden");

    document.querySelectorAll(".interview-video").forEach((block) => {
        block.classList.add("hidden");
    });
}

function backToVideoSections() {
    resetVideoSection();
}

function resetVideoSection() {
    const sections = document.getElementById("video-section-grid");
    const tabs = document.getElementById("video-tabs");
    const list = document.getElementById("interview-list");
    const player = document.getElementById("interview-player");

    if (sections) {
        sections.classList.remove("hidden");
    }

    if (tabs) {
        tabs.classList.remove("hidden");
        tabs.querySelectorAll(".video-tab").forEach((tab) => {
            tab.style.display = "none";
        });
    }

    if (list) {
        list.classList.add("hidden");
    }

    if (player) {
        player.classList.add("hidden");
        player.querySelectorAll(".interview-video").forEach((block) => {
            block.classList.add("hidden");
        });
    }

    stopAllInterviewVideos();
}

function stopAllInterviewVideos() {
    document
        .querySelectorAll("#interview-player .video-container")
        .forEach((container) => {
            container.classList.remove("started");
            const iframe = container.querySelector("iframe");
            if (iframe) {
                iframe.removeAttribute("src");
            }
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
            const url = baseSrc.includes("?")
                ? baseSrc + "&autoplay=1"
                : baseSrc + "?autoplay=1";
            iframe.src = url;
        }
    }

    container.classList.add("started");
}

// Feedback form
document.addEventListener("DOMContentLoaded", () => {
    const feedbackForm = document.getElementById("feedbackForm");
    if (!feedbackForm) return;

    feedbackForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("userEmail").value;
        const message = document.getElementById("message").value;

        fetch("https://formspree.io/f/xojnjpkk", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                name: name,
                email: email,
                message: message,
                _replyto: email,
                _subject: "Сообщение с сайта Эверест",
            }),
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
                if (status) {
                    status.innerText = "Ошибка отправки. Проверьте интернет.";
                }
                console.error(error);
            });
    });
});

