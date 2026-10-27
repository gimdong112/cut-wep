const videoInput = document.querySelector('#videoFile');
const notice = document.querySelector('#notice');
const chooseButtons = document.querySelectorAll('.js-choose-video');

chooseButtons.forEach((button) => {
  button.addEventListener('click', () => videoInput?.click());
});

videoInput?.addEventListener('change', () => {
  const video = videoInput.files?.[0];
  if (!video || !notice) return;

  const sizeInMb = (video.size / (1024 * 1024)).toFixed(1);
  notice.textContent = `${video.name} · ${sizeInMb} MB — 파일을 선택했어요. 자동 편집 기능은 다음 단계에서 연결할게요.`;
});

