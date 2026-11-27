const LoadingScreen = (() => {
  const overlay = document.getElementById("loading-overlay");
  const titleEl = document.getElementById("loading-title");
  const detailEl = document.getElementById("loading-detail");
  const backBtn = document.getElementById("loading-back-menu");

  let onCancel = null;

  function returnToMenu() {
    if (onCancel) onCancel();
    hide();
    const menuScreen = document.getElementById("menu-screen");
    if (menuScreen) {
      document.querySelectorAll(".screen").forEach((el) => el.classList.add("hidden"));
      menuScreen.classList.remove("hidden");
    }
  }

  function show(title = "Connexion à la room en cours...", detail = "Synchronisation WebSocket", cancelFn = null) {
    if (!overlay) return;
    if (titleEl) titleEl.textContent = title;
    if (detailEl) {
      detailEl.textContent = detail;
      detailEl.style.display = detail ? "block" : "none";
    }
    onCancel = typeof cancelFn === "function" ? cancelFn : null;
    if (backBtn) {
      backBtn.classList.toggle("is-hidden", !onCancel);
    }
    overlay.classList.remove("is-hidden");
  }

  function hide() {
    if (!overlay) return;
    overlay.classList.add("is-hidden");
    onCancel = null;
  }

  if (backBtn) {
    backBtn.addEventListener("click", returnToMenu);
  }

  function attachSocket(socket, joinPayload = null) {
    if (!socket) return;

    show(
      "Connexion au serveur...",
      "Ouverture du canal WebSocket",
      () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      }
    );

    socket.addEventListener("open", () => {
      show("Entrée dans la room...", "En attente de la réponse du serveur");
      if (joinPayload) {
        socket.send(JSON.stringify(joinPayload));
      }
    });

    socket.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "room_joined" || msg.type === "joined_room" || msg.type === "room_created") {
          hide();
        } else if (msg.type === "error") {
          show("Connexion impossible", msg.message || "La room est inaccessible.", null);
          setTimeout(hide, 2200);
        }
      } catch (_) {
        // Message non-JSON ignoré
      }
    });

    socket.addEventListener("error", () => {
      show("Erreur WebSocket", "Impossible de joindre le serveur.", null);
      setTimeout(hide, 2200);
    });

    socket.addEventListener("close", () => {
      hide();
    });
  }

  return { show, hide, attachSocket };
})();

// Rend LoadingScreen accessible globalement malgré type="module"
window.LoadingScreen = LoadingScreen;
export default LoadingScreen;