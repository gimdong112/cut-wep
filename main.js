const videoInput = document.querySelector('#videoFile');
const dropzone = document.querySelector('#dropzone');
const emptyState = document.querySelector('#dropzone');
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
const trimStart = document.querySelector('#trimStart');
const trimEnd = document.querySelector('#trimEnd');
const trimStartLabel = document.querySelector('#trimStartLabel');
const trimEndLabel = document.querySelector('#trimEndLabel');
const trimDuration = document.querySelector('#trimDuration');
const trimStatus = document.querySelector('#trimStatus');
const setTrimStartButton = document.querySelector('#setTrimStart');
const setTrimEndButton = document.querySelector('#setTrimEnd');
const previewTrimButton = document.querySelector('#previewTrim');
const exportTrimButton = document.querySelector('#exportTrim');

let currentVideoUrl = null;
let selectedVideo = null;

function openVideoPicker() {
  videoInput?.click();
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '길이를 확인할 수 없어요';
  const wholeSeconds = Math.floor(seconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainder = wholeSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function showVideo(file) {
  if (!file.type.startsWith('video/')) {
    if (notice) notice.textContent = '영상 파일을 선택해주세요.';
    return;
  }

  if (currentVideoUrl) URL.revokeObjectURL(currentVideoUrl);
  currentVideoUrl = URL.createObjectURL(file);
  selectedVideo = file;

  if (videoPreview) {
    videoPreview.src = currentVideoUrl;
    videoPreview.load();
  }
  if (fileName) fileName.textContent = file.name;
  if (fileSize) fileSize.textContent = formatSize(file.size);
  if (fileDuration) fileDuration.textContent = '길이 확인 중';
  if (notice) notice.textContent = '';
  if (emptyState) emptyState.hidden = true;
  if (videoResult) videoResult.hidden = false;
}

function resetVideo() {
  videoPreview?.pause();
  if (videoPreview) {
    videoPreview.removeAttribute('src');
    videoPreview.load();
  }
  if (currentVideoUrl) URL.revokeObjectURL(currentVideoUrl);
  currentVideoUrl = null;
  selectedVideo = null;
  if (videoInput) videoInput.value = '';
  if (videoResult) videoResult.hidden = true;
  if (emptyState) emptyState.hidden = false;
  if (notice) notice.textContent = '';
}

videoInput?.addEventListener('change', () => {
  const file = videoInput.files?.[0];
  videoInput.value = '';
  if (file) showVideo(file);
});

videoPreview?.addEventListener('loadedmetadata', () => {
  if (!videoPreview || !Number.isFinite(videoPreview.duration)) return;
  if (fileDuration) fileDuration.textContent = formatDuration(videoPreview.duration);
  if (trimStart && trimEnd) {
    const duration = Math.max(0.1, videoPreview.duration);
    trimStart.max = String(duration);
    trimEnd.max = String(duration);
    trimStart.value = '0';
    trimEnd.value = String(duration);
    updateTrimDisplay();
  }
});

videoPreview?.addEventListener('error', () => {
  if (fileDuration) fileDuration.textContent = '미리보기를 열 수 없는 형식이에요';
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
  if (!selectedVideo || !trimPanel) return;
  trimPanel.hidden = false;
  trimPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (trimStatus) trimStatus.textContent = '시작과 끝을 조절해 원하는 구간을 선택하세요.';
});

window.addEventListener('beforeunload', () => {
  if (currentVideoUrl) URL.revokeObjectURL(currentVideoUrl);
});

function formatTrimTime(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const remainder = value % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function setTrimMessage(message, state = '') {
  if (!trimStatus) return;
  trimStatus.textContent = message;
  trimStatus.dataset.state = state;
}

function updateTrimDisplay() {
  if (!trimStart || !trimEnd || !trimStartLabel || !trimEndLabel || !trimDuration) return;
  const start = Number(trimStart.value);
  const end = Number(trimEnd.value);
  trimStartLabel.value = formatTrimTime(start);
  trimEndLabel.value = formatTrimTime(end);
  trimDuration.textContent = `선택 구간 ${formatTrimTime(Math.max(0, end - start))}`;
}

trimStart?.addEventListener('input', () => {
  const step = Number(trimStart.step) || 0.1;
  if (trimEnd && Number(trimStart.value) >= Number(trimEnd.value)) {
    trimStart.value = String(Math.max(0, Number(trimEnd.value) - step));
  }
  updateTrimDisplay();
});

trimEnd?.addEventListener('input', () => {
  const step = Number(trimEnd.step) || 0.1;
  if (trimStart && Number(trimEnd.value) <= Number(trimStart.value)) {
    trimEnd.value = String(Math.min(Number(trimEnd.max), Number(trimStart.value) + step));
  }
  updateTrimDisplay();
});

setTrimStartButton?.addEventListener('click', () => {
  if (!videoPreview || !trimStart || !trimEnd) return;
  const latestStart = Math.max(0, Number(trimEnd.value) - 0.1);
  trimStart.value = String(Math.min(latestStart, videoPreview.currentTime));
  updateTrimDisplay();
});

setTrimEndButton?.addEventListener('click', () => {
  if (!videoPreview || !trimStart || !trimEnd) return;
  const earliestEnd = Math.min(Number(trimEnd.max), Number(trimStart.value) + 0.1);
  trimEnd.value = String(Math.max(earliestEnd, Math.min(Number(trimEnd.max), videoPreview.currentTime)));
  updateTrimDisplay();
});

previewTrimButton?.addEventListener('click', async () => {
  if (!videoPreview || !trimStart || !trimEnd) return;
  videoPreview.currentTime = Number(trimStart.value);
  try {
    await videoPreview.play();
    setTrimMessage('선택 구간을 재생하고 있어요. 끝 지점에서 자동으로 멈춥니다.');
  } catch {
    setTrimMessage('미리보기를 재생할 수 없어요. 영상 컨트롤의 재생 버튼을 눌러주세요.', 'error');
  }
});

videoPreview?.addEventListener('timeupdate', () => {
  if (!trimEnd || videoPreview.paused) return;
  if (videoPreview.currentTime >= Number(trimEnd.value)) {
    videoPreview.pause();
    videoPreview.currentTime = Number(trimEnd.value);
  }
});

exportTrimButton?.addEventListener('click', async () => {
  if (!videoPreview || !trimStart || !trimEnd || !selectedVideo) return;
  const start = Number(trimStart.value);
  const end = Number(trimEnd.value);
  if (end <= start) {
    setTrimMessage('끝 시간은 시작 시간보다 뒤여야 해요.', 'error');
    return;
  }
  if (!window.MediaRecorder) {
    setTrimMessage('이 브라우저는 영상 저장을 지원하지 않아요. Chrome이나 Edge에서 시도해주세요.', 'error');
    return;
  }
  const capture = videoPreview.captureStream || videoPreview.webkitCaptureStream;
  if (!capture) {
    setTrimMessage('이 브라우저는 영상 저장을 지원하지 않아요. Chrome이나 Edge에서 시도해주세요.', 'error');
    return;
  }
  const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    .find((type) => MediaRecorder.isTypeSupported(type));
  if (!mimeType) {
    setTrimMessage('저장할 수 있는 영상 형식을 찾지 못했어요. Chrome이나 Edge에서 시도해주세요.', 'error');
    return;
  }

  let stream;
  let recorder;
  try {
    videoPreview.pause();
    if (Math.abs(videoPreview.currentTime - start) > 0.05) {
      await new Promise((resolve) => {
        videoPreview.addEventListener('seeked', resolve, { once: true });
        videoPreview.currentTime = start;
      });
    }
    stream = capture.call(videoPreview);
    const chunks = [];
    recorder = new MediaRecorder(stream, { mimeType });
    exportTrimButton.disabled = true;
    setTrimMessage('저장 중이에요. 선택 구간 길이만큼 실시간으로 처리합니다.', 'busy');

    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    recorder.addEventListener('stop', () => {
      stream.getTracks().forEach((track) => track.stop());
      exportTrimButton.disabled = false;
      if (!chunks.length) {
        setTrimMessage('저장할 영상 데이터가 없어요. 구간을 다시 선택해 시도해주세요.', 'error');
        return;
      }
      const blob = new Blob(chunks, { type: mimeType });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const baseName = selectedVideo.name.replace(/\.[^.]+$/, '') || 'cutmate-video';
      link.href = downloadUrl;
      link.download = `${baseName}-cut.webm`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setTrimMessage('저장이 끝났어요. 다운로드 폴더에서 잘라낸 영상을 확인하세요.');
      videoPreview.currentTime = start;
    }, { once: true });

    const stopRecording = () => {
      if (recorder?.state === 'recording') {
        videoPreview.pause();
        recorder.stop();
      }
    };
    const checkEnd = () => {
      if (recorder?.state === 'recording' && videoPreview.currentTime >= end) stopRecording();
    };
    videoPreview.addEventListener('timeupdate', checkEnd);
    videoPreview.addEventListener('ended', stopRecording, { once: true });
    recorder.addEventListener('stop', () => videoPreview.removeEventListener('timeupdate', checkEnd), { once: true });
    recorder.start(250);
    await videoPreview.play();
  } catch {
    if (recorder?.state === 'recording') recorder.stop();
    else stream?.getTracks().forEach((track) => track.stop());
    exportTrimButton.disabled = false;
    setTrimMessage('영상 저장 중 문제가 생겼어요. 구간을 짧게 지정해 다시 시도해주세요.', 'error');
  }
});

