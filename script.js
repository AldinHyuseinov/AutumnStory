// Създаване на есенни листа
const leavesContainer = document.getElementById("leaves-container");
function createLeaf() {
  const leaf = document.createElement("img");
  leaf.src = "./assets/leaf.png";
  leaf.classList.add("leaf");
  leaf.style.width = Math.random() * 3 + 2 + "%"; // Размер в % спрямо играта
  leaf.style.left = Math.random() * 100 + "%";
  const duration = Math.random() * 5 + 6;
  leaf.style.animationDuration = duration + "s";
  leavesContainer.appendChild(leaf);
  setTimeout(() => leaf.remove(), duration * 1000);
}
setInterval(createLeaf, 600);

// ---------------- ДИАЛОЗИ И РЕД НА ДЕЙСТВИЕ ---------------- //
const order = ["bear", "squirrel", "hedgehog"];
let currentStageIndex = 0;
let itemsEaten = 0;
let isAnimating = false;
let dialogueTimeout;

const dialogues = {
  bear: {
    intro: {
      text: "Здравей! Аз съм Мечо. Моля те, помогни ми да намеря вкусна храна за зимата!",
      start: 0,
      dur: 7.4,
    },
    wrong: { text: "Блее! Това не го ям. Потърси моята храна!", start: 3.6, dur: 5 },
    partial: {
      text: "Ммм, много вкусно! Но коремчето ми иска и другото лакомство!",
      start: 6.5,
      dur: 6.3,
    },
    thanks: {
      text: "Благoдаря ти! Готов съм за сън. Сега помогни на катеричката!",
      start: 12,
      dur: 7.4,
    },
  },
  squirrel: {
    intro: {
      text: "Здравей! Аз съм катеричката Роси. Трябва ми храна за зимата!",
      start: 0,
      dur: 6,
    },
    wrong: { text: "Ох, не! Това не е за мен.", start: 3, dur: 3.3 },
    partial: {
      text: "Ехаа! Страхотно, но имам нужда от още нещо за зимата!",
      start: 4.5,
      dur: 6.5,
    },
    thanks: { text: "Ура! Събрах достатъчно! Ред е на малкия таралеж.", start: 9, dur: 6 },
  },
  hedgehog: {
    intro: { text: "Здравей! Аз съм таралежът Ежко. Търся си храна.", start: 0, dur: 5.5 },
    wrong: { text: "Оф, това не го харесвам. Потърси нещо по-вкусно за мен!", start: 2.5, dur: 5 },
    partial: { text: "Чудесно! А къде е другото?", start: 5, dur: 4 },
    thanks: { text: "Много ти благодаря! Вече всички сме готови за зимата!", start: 7, dur: 5 },
  },
};

let currentVoiceClip = null;

function playVoice(animalId, type) {
  const voiceFile = document.getElementById(`${animalId}-voice-file`);
  const clipData = dialogues[animalId][type];

  if (!voiceFile || !clipData) return;

  // Спираме предишния глас, ако още говори
  voiceFile.pause();

  // Превъртаме до стартовата секунда
  voiceFile.currentTime = clipData.start;
  voiceFile.play();

  // Спираме аудиото точно след продължителността на репликата
  if (currentVoiceClip) clearTimeout(currentVoiceClip);

  currentVoiceClip = setTimeout(() => {
    voiceFile.pause();
  }, clipData.dur * 1000);
}

const bgMusic = document.getElementById("bg-music");
bgMusic.volume = 0.2;

window.onload = () => {
  const startBtn = document.getElementById("start-btn");
  const startScreen = document.getElementById("start-screen");
  const instructions = document.querySelector(".instructions");

  startBtn.addEventListener("click", () => {
    startScreen.style.transition = "opacity 0.8s ease";
    startScreen.style.opacity = "0";

    bgMusic.play().catch((error) => console.log("Музиката е блокирана от браузъра:", error));

    setTimeout(() => {
      startScreen.style.display = "none";
      instructions.style.display = "block";
      requestAnimationFrame(() => {
        instructions.classList.add("animate-in");
      });
      startStage(currentStageIndex);
    }, 800);
  });
};

function startStage(index) {
  itemsEaten = 0;
  const activeAnimalId = order[index];

  order.forEach((id) => {
    const animal = document.getElementById(id);
    if (id === activeAnimalId) {
      animal.classList.remove("dimmed");
      animal.classList.add("active-animal");
    } else {
      animal.classList.add("dimmed");
      animal.classList.remove("active-animal");
    }
  });

  isAnimating = true;
  setTimeout(() => {
    showDialogue(activeAnimalId, dialogues[activeAnimalId].intro.text, false);
    playVoice(activeAnimalId, "intro");
    isAnimating = false;
  }, dialogues[activeAnimalId].intro.start * 1000);
}

function showDialogue(animalId, text, autoHide = false, delay = 3500) {
  const bubble = document.getElementById("speech-bubble");
  const animal = document.getElementById(animalId);

  // Вземаме позициите спрямо родителя (#game-area)
  const animalLeft = animal.offsetLeft;
  const animalTop = animal.offsetTop;
  const animalWidth = animal.offsetWidth;

  bubble.innerText = text;
  bubble.style.opacity = 1;

  // Центрираме балончето над животното, използвайки неговите координати вътре в играта
  bubble.style.left = animalLeft + animalWidth / 2 + "px";
  bubble.style.top = animalTop - 10 + "px";
  bubble.style.transform = "translate(-50%, -100%)";

  if (dialogueTimeout) clearTimeout(dialogueTimeout);

  if (autoHide) {
    dialogueTimeout = setTimeout(() => {
      bubble.style.opacity = 0;
    }, delay);
  }
}

// ---------------- DRAG AND DROP ЛОГИКА ---------------- //
let draggedItem = null;
let offsetX = 0,
  offsetY = 0;

document.querySelectorAll(".food").forEach((food) => {
  food.addEventListener("pointerdown", (e) => {
    if (isAnimating) return;

    draggedItem = e.target;
    const rect = draggedItem.getBoundingClientRect();

    // Изчисляваме разликата между мишката и горния ляв ъгъл на обекта
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    draggedItem.style.animation = "none";
    draggedItem.style.transition = "none";
    draggedItem.style.zIndex = 1000;

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  });
});

function onPointerMove(e) {
  if (!draggedItem) return;

  // Намираме контейнера
  const gameArea = document.getElementById("game-area");
  const areaRect = gameArea.getBoundingClientRect();

  // Изчисляваме новата позиция спрямо контейнера
  let newX = e.clientX - areaRect.left - offsetX;
  let newY = e.clientY - areaRect.top - offsetY;

  draggedItem.style.left = newX + "px";
  draggedItem.style.top = newY + "px";
}

function onPointerUp(e) {
  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);

  if (!draggedItem) return;

  const activeAnimalId = order[currentStageIndex];
  const activeAnimal = document.getElementById(activeAnimalId);

  if (checkCollision(draggedItem, activeAnimal)) {
    const targetFoodId = draggedItem.getAttribute("data-target");

    if (targetFoodId === activeAnimalId) {
      processCorrectFood(draggedItem, activeAnimal, activeAnimalId);
    } else {
      const errorSound = document.getElementById("error-sound");
      errorSound.currentTime = 0; // Рестартира звука, ако се кликне бързо
      errorSound.play();

      showDialogue(
        activeAnimalId,
        dialogues[activeAnimalId].wrong.text,
        true,
        dialogues[activeAnimalId].wrong.dur * 1000,
      );
      playVoice(activeAnimalId, "wrong");
      snapBack(draggedItem);
    }
  } else {
    snapBack(draggedItem);
  }
  draggedItem = null;
}

function checkCollision(item, target) {
  const rectItem = item.getBoundingClientRect();
  const rectTarget = target.getBoundingClientRect();
  const centerX = rectItem.left + rectItem.width / 2;
  const centerY = rectItem.top + rectItem.height / 2;

  return (
    centerX >= rectTarget.left &&
    centerX <= rectTarget.right &&
    centerY >= rectTarget.top &&
    centerY <= rectTarget.bottom
  );
}

function snapBack(item) {
  // ВАЖНО: Просто изтриваме left и top стиловете, които зададохме ръчно.
  // Така елементът се връща към left: XX% и top: XX%, които са в CSS файла.
  item.style.transition = "all 0.6s cubic-bezier(0.25, 1.5, 0.5, 1)";
  item.style.left = "";
  item.style.top = "";

  setTimeout(() => {
    item.style.transition = "";
    item.style.animation = "";
    item.style.zIndex = 10;
  }, 600);
}

function processCorrectFood(food, animal, animalId) {
  isAnimating = true;
  food.style.display = "none";
  itemsEaten++;

  const successSound = document.getElementById("success-sound");
  successSound.currentTime = 0;
  successSound.play();
  setTimeout(() => {
    successSound.pause();
  }, 1000);

  animal.classList.add("happy");
  createSparkles(animal);

  if (itemsEaten === 1) {
    showDialogue(animalId, dialogues[animalId].partial.text);
    playVoice(animalId, "partial");

    setTimeout(() => {
      animal.classList.remove("happy");
      document.getElementById("speech-bubble").style.opacity = 0;
      isAnimating = false;
    }, dialogues[animalId].partial.dur * 1000);
  } else if (itemsEaten === 2) {
    showDialogue(animalId, dialogues[animalId].thanks.text);
    playVoice(animalId, "thanks");

    setTimeout(() => {
      document.getElementById("speech-bubble").style.opacity = 0;
      animal.classList.remove("happy");
      animal.classList.remove("active-animal");
      animal.classList.add("dimmed");
      currentStageIndex++;
      if (currentStageIndex < order.length) {
        startStage(currentStageIndex);
      } else {
        showVictory();
      }
    }, dialogues[animalId].thanks.dur * 1000);
  }
}

// ---------------- ЕФЕКТИ ---------------- //
function createSparkles(animal) {
  const rect = animal.getBoundingClientRect();
  const gameRect = document.getElementById("game-area").getBoundingClientRect();
  const colors = ["#ffd700", "#ff8c00", "#ffffff", "#ff4500"];

  for (let i = 0; i < 20; i++) {
    const sparkle = document.createElement("div");
    sparkle.classList.add("sparkle");

    // Позиционираме искрите спрямо играта
    sparkle.style.left = rect.left - gameRect.left + rect.width / 2 + "px";
    sparkle.style.top = rect.top - gameRect.top + rect.height / 2 + "px";

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 100 + 50;
    sparkle.style.setProperty("--dx", Math.cos(angle) * distance + "px");
    sparkle.style.setProperty("--dy", Math.sin(angle) * distance + "px");
    sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    document.getElementById("game-area").appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1000);
  }
}

function showVictory() {
  // Намаляваме фоновата музика, за да се чуе триумфалния звук
  bgMusic.animate({ volume: 0 }, 1000);
  setTimeout(() => bgMusic.pause(), 1000);

  const victorySound = document.getElementById("victory-sound");
  victorySound.play();

  const vs = document.getElementById("victory-screen");
  vs.style.display = "flex";
  void vs.offsetWidth;
  vs.classList.add("show");
  createConfetti();
}

function createConfetti() {
  const colors = ["#ff4500", "#ffd700", "#32cd32", "#1e90ff", "#ff69b4", "#9400d3"];
  for (let i = 0; i < 150; i++) {
    const conf = document.createElement("div");
    conf.classList.add("confetti");
    conf.style.left = Math.random() * 100 + "vw";
    conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const duration = Math.random() * 3 + 2;
    conf.style.animationDuration = duration + "s";
    conf.style.animationDelay = Math.random() * 2 + "s";
    document.body.appendChild(conf);
  }
}
