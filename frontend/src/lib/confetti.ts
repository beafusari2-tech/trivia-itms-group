import confetti from "canvas-confetti";

export function fireConfetti(): void {
  const duration = 1500;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      origin: { x: 0 },
      colors: ["#7C3AED", "#EC4899", "#2563EB", "#ffffff"],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      origin: { x: 1 },
      colors: ["#7C3AED", "#EC4899", "#2563EB", "#ffffff"],
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

export function fireBurst(): void {
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.7 },
    colors: ["#7C3AED", "#EC4899", "#2563EB", "#ffffff"],
  });
}
