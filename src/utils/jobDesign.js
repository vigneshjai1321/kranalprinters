const demoDesignImages = [
  "/images/printingprocess.jpg",
  "/images/packagingbox.jpg",
  "/images/pharmacartons.jpg",
];

export function getJobDesignImage(job) {
  const imageFromData = job?.layout_image || job?.design_image || job?.designImage || "";
  if (imageFromData) return imageFromData;

  const numericId = Number(job?.id || 0);
  const index = Number.isFinite(numericId) && numericId > 0
    ? (numericId - 1) % demoDesignImages.length
    : 0;

  return demoDesignImages[index];
}

export function getDemoDesignImages() {
  return [...demoDesignImages];
}
