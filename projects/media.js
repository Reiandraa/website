// Load a third-party player only after the visitor chooses to play the video.
for (const container of document.querySelectorAll('[data-video-id]')) {
  const button = container.querySelector('button');
  const videoId = container.dataset.videoId;
  if (!button || !/^[\w-]{11}$/.test(videoId ?? '')) continue;
  button.addEventListener('click', () => {
    const player = document.createElement('iframe');
    player.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    player.title = container.dataset.videoTitle || 'Project video';
    player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    container.replaceChildren(player);
    player.focus();
  }, { once: true });
}
