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
const trimPreviewBox = document.querySelector('#trimPreview');
const trimPreviewVideo = document.querySelector('#trimPreviewVideo');
const trimPreviewRange = document.querySelector('#trimPreviewRange');
const addSegmentButton = document.querySelector('#addSegment');
const segmentList = document.querySelector('#segmentList');
const segmentEmpty = document.querySelector('#segmentEmpty');
const segmentSummary = document.querySelector('#segmentSummary');
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
const editSegments = [];
let playbackQueue = [];
let playbackIndex = -1;
let queueTransitioning = false;
let activeRecorder = null;

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
  if (activeRecorder?.state === 'recording') {
    setTrimMessage('저장이 끝난 뒤 다른 영상을 선택해주세요.', 'busy');
    return;
  }
  if (!file.type.startsWith('video/')) {
    if (notice) notice.textContent = '영상 파일을 선택해주세요.';
    return;
  }

  trimPreviewVideo?.pause();
  videoPreview?.pause();
  if (currentVideoUrl) URL.revokeObjectURL(currentVideoUrl);
  editSegments.splice(0, editSegments.length);
  playbackQueue = [];
  playbackIndex = -1;
  renderSegments();
  if (trimPreviewBox) trimPreviewBox.hidden = true;
  currentVideoUrl = URL.createObjectURL(file);
  selectedVideo = file;

  if (videoPreview) {
    videoPreview.src = currentVideoUrl;
    videoPreview.load();
  }
  if (trimPreviewVideo) {
    trimPreviewVideo.pause();
    trimPreviewVideo.src = currentVideoUrl;
    trimPreviewVideo.load();
  }
  if (trimPreviewBox) trimPreviewBox.hidden = true;
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

function renderSegments() {
  if (!segmentList || !segmentEmpty) return;
  segmentList.replaceChildren();
  segmentEmpty.hidden = editSegments.length > 0;
  const totalDuration = editSegments.reduce((sum, segment) => sum + segment.end - segment.start, 0);
  if (segmentSummary) segmentSummary.textContent = editSegments.length ? `${editSegments.length}개 · ${formatTrimTime(totalDuration)}` : '0개 구간';
  if (addSegmentButton) addSegmentButton.disabled = Boolean(activeRecorder);
  if (trimStart) trimStart.disabled = Boolean(activeRecorder);
  if (trimEnd) trimEnd.disabled = Boolean(activeRecorder);
  if (setTrimStartButton) setTrimStartButton.disabled = Boolean(activeRecorder);
  if (setTrimEndButton) setTrimEndButton.disabled = Boolean(activeRecorder);
  if (replaceVideoButton) replaceVideoButton.disabled = Boolean(activeRecorder);
  if (trimPreviewVideo) trimPreviewVideo.controls = !activeRecorder;
  if (previewTrimButton) previewTrimButton.disabled = editSegments.length === 0 || Boolean(activeRecorder);
  if (exportTrimButton) exportTrimButton.disabled = editSegments.length === 0 || Boolean(activeRecorder);
  updatePreviewSummary();

  editSegments.forEach((segment, index) => {
    const item = document.createElement('li');
    item.className = 'segment-item';
    const number = document.createElement('span');
    number.className = 'segment-number';
    number.textContent = String(index + 1).padStart(2, '0');
    const details = document.createElement('div');
    details.className = 'segment-details';
    const title = document.createElement('strong');
    title.textContent = `구간 ${index + 1}`;
    const times = document.createElement('span');
    times.textContent = `${formatTrimTime(segment.start)}–${formatTrimTime(segment.end)} · ${formatTrimTime(segment.end - segment.start)}`;
    details.append(title, times);
    const actions = document.createElement('div');
    actions.className = 'segment-item-actions';
    const up = document.createElement('button');
    up.type = 'button'; up.textContent = '↑'; up.dataset.action = 'up'; up.dataset.index = String(index);
    up.setAttribute('aria-label', `구간 ${index + 1}을 위로 이동`); up.disabled = index === 0 || Boolean(activeRecorder);
    const down = document.createElement('button');
    down.type = 'button'; down.textContent = '↓'; down.dataset.action = 'down'; down.dataset.index = String(index);
    down.setAttribute('aria-label', `구간 ${index + 1}을 아래로 이동`); down.disabled = index === editSegments.length - 1 || Boolean(activeRecorder);
    const remove = document.createElement('button');
    remove.type = 'button'; remove.textContent = '삭제'; remove.dataset.action = 'remove'; remove.dataset.index = String(index);
    remove.setAttribute('aria-label', `구간 ${index + 1} 삭제`); remove.disabled = Boolean(activeRecorder);
    actions.append(up, down, remove);
    item.append(number, details, actions);
    segmentList.append(item);
  });
}

addSegmentButton?.addEventListener('click', () => {
  if (!trimStart || !trimEnd || activeRecorder) return;
  const start = Number(trimStart.value);
  const end = Number(trimEnd.value);
  if (end <= start) {
    setTrimMessage('끝 시간은 시작 시간보다 뒤여야 구간을 추가할 수 있어요.', 'error');
    return;
  }
  editSegments.push({ start, end });
  renderSegments();
  refreshTrimPreviewSelection();
  setTrimMessage(`구간 ${editSegments.length}을 추가했어요. 다른 구간도 선택해 이어서 추가할 수 있습니다.`);
});

segmentList?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || activeRecorder) return;
  const index = Number(button.dataset.index);
  const action = button.dataset.action;
  if (action === 'remove') editSegments.splice(index, 1);
  if (action === 'up' && index > 0) [editSegments[index - 1], editSegments[index]] = [editSegments[index], editSegments[index - 1]];
  if (action === 'down' && index < editSegments.length - 1) [editSegments[index + 1], editSegments[index]] = [editSegments[index], editSegments[index + 1]];
  if (trimPreviewVideo) trimPreviewVideo.pause();
  playbackIndex = -1;
  renderSegments();
  updatePreviewSummary();
  setTrimMessage(editSegments.length ? '구간 목록을 업데이트했어요. 순서대로 이어 붙여 미리 볼 수 있습니다.' : '구간이 모두 삭제됐어요. 시작과 끝을 정하고 다시 추가해주세요.');
});

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
  refreshTrimPreviewSelection();
});

setTrimEndButton?.addEventListener('click', () => {
  if (!videoPreview || !trimStart || !trimEnd) return;
  const earliestEnd = Math.min(Number(trimEnd.max), Number(trimStart.value) + 0.1);
  trimEnd.value = String(Math.max(earliestEnd, Math.min(Number(trimEnd.max), videoPreview.currentTime)));
  updateTrimDisplay();
  refreshTrimPreviewSelection();
});

async function seekPreviewTo(seconds) {
  if (!trimPreviewVideo || Math.abs(trimPreviewVideo.currentTime - seconds) <= 0.05) return;
  await new Promise((resolve) => {
    trimPreviewVideo.addEventListener('seeked', resolve, { once: true });
    trimPreviewVideo.currentTime = seconds;
  });
}

function updatePreviewSummary() {
  if (!trimPreviewRange) return;
  const total = editSegments.reduce((sum, segment) => sum + segment.end - segment.start, 0);
  trimPreviewRange.textContent = `${editSegments.length}개 구간 · 총 ${formatTrimTime(total)}`;
}

async function startSegmentQueue() {
  if (!trimPreviewVideo || !trimPreviewBox || !editSegments.length || !currentVideoUrl) return;
  trimPreviewBox.hidden = false;
  if (trimPreviewVideo.src !== currentVideoUrl) {
    trimPreviewVideo.src = currentVideoUrl;
    trimPreviewVideo.load();
  }
  try {
    if (trimPreviewVideo.readyState < 1) {
      await new Promise((resolve) => trimPreviewVideo.addEventListener('loadedmetadata', resolve, { once: true }));
    }
    playbackQueue = editSegments.map((segment) => ({ ...segment }));
    playbackIndex = 0;
    queueTransitioning = true;
    trimPreviewVideo.pause();
    await seekPreviewTo(playbackQueue[0].start);
    await trimPreviewVideo.play();
    queueTransitioning = false;
    trimPreviewBox.dataset.playing = 'true';
    updatePreviewSummary();
    setTrimMessage(activeRecorder
      ? `전체 ${editSegments.length}개 구간을 이어 붙여 저장 중이에요.`
      : `전체 ${editSegments.length}개 구간을 순서대로 미리 보고 있어요.`, 'busy');
  } catch {
    queueTransitioning = false;
    if (activeRecorder?.state === 'recording') activeRecorder.stop();
    setTrimMessage('재생을 시작하지 못했어요. 미리보기 영상의 재생 버튼을 눌러주세요.', 'error');
  }
}

async function advanceSegmentQueue() {
  if (!trimPreviewVideo || queueTransitioning || playbackIndex < 0) return;
  const currentSegment = playbackQueue[playbackIndex];
  if (!currentSegment || trimPreviewVideo.currentTime < currentSegment.end) return;
  queueTransitioning = true;
  if (playbackIndex + 1 >= playbackQueue.length) {
    trimPreviewVideo.pause();
    trimPreviewVideo.currentTime = currentSegment.end;
    playbackIndex = -1;
    trimPreviewBox.dataset.playing = 'false';
    if (activeRecorder?.state === 'recording') activeRecorder.stop();
    else setTrimMessage('전체 편집 결과 미리보기가 끝났어요. 구간을 수정하거나 저장할 수 있어요.');
    queueTransitioning = false;
    return;
  }
  playbackIndex += 1;
  const nextSegment = playbackQueue[playbackIndex];
  trimPreviewVideo.pause();
  try {
    await seekPreviewTo(nextSegment.start);
    await trimPreviewVideo.play();
    trimPreviewBox.dataset.playing = 'true';
  } catch {
    if (activeRecorder?.state === 'recording') activeRecorder.stop();
    setTrimMessage('다음 구간으로 이동하지 못했어요. 영상 형식을 확인해주세요.', 'error');
  } finally {
    queueTransitioning = false;
  }
}

previewTrimButton?.addEventListener('click', () => {
  if (!editSegments.length) {
    setTrimMessage('먼저 영상에 넣을 구간을 추가해주세요.', 'error');
    return;
  }
  if (activeRecorder) return;
  setTrimMessage('전체 편집 결과를 준비하고 있어요.');
  startSegmentQueue();
});

trimPreviewVideo?.addEventListener('timeupdate', advanceSegmentQueue);
trimPreviewVideo?.addEventListener('ended', advanceSegmentQueue);
trimPreviewVideo?.addEventListener('pause', () => {
  if (trimPreviewBox && !queueTransitioning) trimPreviewBox.dataset.playing = 'false';
});
trimPreviewVideo?.addEventListener('seeking', () => {
  if (playbackIndex < 0 || queueTransitioning || !trimPreviewVideo) return;
  const segment = playbackQueue[playbackIndex];
  if (!segment) return;
  if (trimPreviewVideo.currentTime < segment.start) trimPreviewVideo.currentTime = segment.start;
  else if (trimPreviewVideo.currentTime > segment.end) trimPreviewVideo.currentTime = segment.end;
});

function refreshTrimPreviewSelection() {
  if (!trimPreviewBox || trimPreviewBox.hidden || !trimStart || !trimEnd) return;
  if (activeRecorder) return;
  trimPreviewVideo?.pause();
  playbackIndex = -1;
  updatePreviewSummary();
  setTrimMessage('구간이 바뀌었어요. 미리보기 버튼을 눌러 새 결과를 확인하세요.');
}

trimStart?.addEventListener('input', refreshTrimPreviewSelection);
trimEnd?.addEventListener('input', refreshTrimPreviewSelection);

exportTrimButton?.addEventListener('click', async () => {
  if (!trimPreviewVideo || !selectedVideo || !editSegments.length || activeRecorder) return;
  if (!window.MediaRecorder) {
    setTrimMessage('이 브라우저는 영상 저장을 지원하지 않아요. Chrome이나 Edge에서 시도해주세요.', 'error');
    return;
  }
  const capture = trimPreviewVideo.captureStream || trimPreviewVideo.webkitCaptureStream;
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
  try {
    if (trimPreviewVideo.readyState < 1) {
      await new Promise((resolve) => trimPreviewVideo.addEventListener('loadedmetadata', resolve, { once: true }));
    }
    stream = capture.call(trimPreviewVideo);
    const chunks = [];
    activeRecorder = new MediaRecorder(stream, { mimeType });
    renderSegments();
    activeRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    activeRecorder.addEventListener('stop', () => {
      stream.getTracks().forEach((track) => track.stop());
      activeRecorder = null;
      renderSegments();
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
      setTrimMessage(`${editSegments.length}개 구간을 이어 붙인 영상 저장이 끝났어요.`);
    }, { once: true });
    activeRecorder.start(250);
    await startSegmentQueue();
  } catch {
    if (activeRecorder?.state === 'recording') activeRecorder.stop();
    else {
      stream?.getTracks().forEach((track) => track.stop());
      activeRecorder = null;
      renderSegments();
    }
    setTrimMessage('영상 저장 중 문제가 생겼어요. 구간을 짧게 지정해 다시 시도해주세요.', 'error');
  }
});

