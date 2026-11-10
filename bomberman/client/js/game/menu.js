document.addEventListener("DOMContentLoaded", () => {
    // Lancement des grenouilles de toutes les couleurs en arrière-plan
    initBackgroundFrogs();
});

function initBackgroundFrogs() {
    const bgContainer = document.getElementById("frogs-background");
    if (!bgContainer) return;

    // Liste de toutes tes couleurs de dossiers (ex: "bleu", "vert", "rouge", etc.)
    const colors = ["bleu", "vert", "rouge"]; 
    const directions = ["bas", "haut", "gauche", "droite"];
    const numberOfFrogs = 8; // Nombre de grenouilles en fond

    for (let i = 0; i < numberOfFrogs; i++) {
        createImgFrog(bgContainer, colors, directions);
    }
}

function createImgFrog(container, colors, directions) {
    const frog = document.createElement("img");
    frog.classList.add("bg-frog");

    const color = colors[Math.floor(Math.random() * colors.length)];
    const dir = directions[Math.floor(Math.random() * directions.length)];
    
    // Position aléatoire sur l'écran
    let posX = Math.random() * window.innerWidth;
    let posY = Math.random() * window.innerHeight;
    
    let speedX = 0;
    let speedY = 0;
    if (dir === "droite") speedX = 1;
    if (dir === "gauche") speedX = -1;
    if (dir === "bas") speedY = 1;
    if (dir === "haut") speedY = -1;

    let frame = 1;

    // Attribution de l'image initiale
    frog.src = `img/${color}/${dir}1.png`;
    frog.style.left = `${posX}px`;
    frog.style.top = `${posY}px`;

    // Animation du mouvement et alternance des sprites (frame 1 et 2)
    setInterval(() => {
        frame = frame === 1 ? 2 : 1;
        frog.src = `img/${color}/${dir}${frame}.png`;

        posX += speedX;
        posY += speedY;

        // Boucle de réapparition aux bords de l'écran
        if (posX > window.innerWidth + 50) posX = -50;
        if (posX < -50) posX = window.innerWidth + 50;
        if (posY > window.innerHeight + 50) posY = -50;
        if (posY < -50) posY = window.innerHeight + 50;

        frog.style.left = `${posX}px`;
        frog.style.top = `${posY}px`;
    }, 250);

    container.appendChild(frog);
}

function initBackgroundFrogs() {
    const bgContainer = document.getElementById("frogs-background");
    if (!bgContainer) return;

    const colors = ["bleu", "vert", "rouge", "jaune"]; // couleurs
    const directions = ["bas", "haut", "gauche", "droite"]; // vues grnouilles
    
    // nbr grenouilles qui s'affichent
    const numberOfFrogs = 72; 

    for (let i = 0; i < numberOfFrogs; i++) {
        createImgFrog(bgContainer, colors, directions);
    }
}