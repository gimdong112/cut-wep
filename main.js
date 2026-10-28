const videoInput = document.querySelector('#videoFile');
const dropzone = document.querySelector('#dropzone');
const videoResult = document.querySelector('#videoResult');
const videoPreview = document.querySelector('#videoPreview');
const fileName = document.querySelector('#fileName');
const fileSize = document.querySelector('#fileSize');
const fileDuration = document.querySelector('#fileDuration');
const notice = document.querySelector('#notice');
const selectVideoButton = document.querySelector('#selectVideoButton');
const replaceVideoButton = document.querySelector('#replaceVideoButton');
const continueButton = document.querySelector('#continueButton');
const trimPanel = document.querySelector('#trimPanel');
const sensitivity = document.querySelector('#silenceSensitivity');
const sensitivityValue = document.querySelector('#sensitivityValue');

let currentVideoUrl = null;

function openVideoPicker() {
  videoInput?.click();
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '길이를 확인할 수 없어요';
  const wholeSeconds = Math.floor(seconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainder = wholeSeconds % 60;
  return hours > 0
    ? hours + ':' + String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0')
    : minutes + ':' + String(remainder).padStart(2, '0');
}

function showVideo(file) {
  if (!file || !file.type.startsWith('video/')) {
    if (notice) notice.textContent = '영상 파일을 선택해주세요.';
    return;
  }

  if (currentVideoUrl) URL.revokeObjectURL(currentVideoUrl);
  currentVideoUrl = URL.createObjectURL(file);
  if (videoPreview) {
    videoPreview.src = currentVideoUrl;
    videoPreview.load();
  }
  if (fileName) fileName.textContent = file.name;
  if (fileSize) fileSize.textContent = formatSize(file.size);
  if (fileDuration) fileDuration.textContent = '길이 확인 중';
  if (notice) notice.textContent = '';
  if (dropzone) dropzone.hidden = true;
  if (videoResult) videoResult.hidden = false;
}

videoInput?.addEventListener('change', () => {
  const file = videoInput.files?.[0];
  videoInput.value = '';
  if (file) showVideo(file);
});

videoPreview?.addEventListener('loadedmetadata', () => {
  if (fileDuration && videoPreview) fileDuration.textContent = formatDuration(videoPreview.duration);
});

videoPreview?.addEventListener('error', () => {
  if (fileDuration) fileDuration.textContent = '이 브라우저에서 미리 볼 수 없는 형식이에요';
  if (notice) notice.textContent = '다른 브라우저에서 재생되거나 MP4 형식으로 변환해야 할 수 있어요.';
});

selectVideoButton?.addEventListener('click', openVideoPicker);
replaceVideoButton?.addEventListener('click', openVideoPicker);

dropzone?.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add('is-dragging');
});

dropzone?.addEventListener('dragleave', (event) => {
  if (!dropzone.contains(event.relatedTarget)) dropzone.classList.remove('is-dragging');
});

dropzone?.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('is-dragging');
  const file = event.dataTransfer?.files[0];
  if (file) showVideo(file);
});

continueButton?.addEventListener('click', () => {
  if (!currentVideoUrl || !trimPanel) return;
  trimPanel.hidden = false;
  trimPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

const sensitivityLabels = {
  1: '매우 낮음',
  2: '낮음',
  3: '보통',
  4: '높음',
  5: '매우 높음',
};

sensitivity?.addEventListener('input', () => {
  if (sensitivityValue) sensitivityValue.value = sensitivityLabels[sensitivity.value] || '보통';
});

window.addEventListener('beforeunload', () => {
  if (currentVideoUrl) URL.revokeObjectURL(currentVideoUrl);
});

