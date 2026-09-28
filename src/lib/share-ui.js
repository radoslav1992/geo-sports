import {buildShareResult, platformLinks, createScorecard, scoreBand} from './share.js';

export function createSharing() {
  const $ = id => document.getElementById(id);
  let current = null, file = null, objectUrl = null, generation = 0, busy = false;
  const status = message => { $('share-status').textContent = message; };
  const supportsShare = typeof navigator.share === 'function';
  $('share-label').textContent = supportsShare ? 'Share my score' : 'Copy my score';

  async function copyScore() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.fullText);
      status('Score copied. Paste it into a post or message.');
      $('share-fallback').hidden = true;
    } catch {
      $('share-fallback').value = current.fullText;
      $('share-fallback').hidden = false;
      $('share-fallback').focus(); $('share-fallback').select();
      status('Select and copy your score below.');
    }
  }
  $('copy-score').onclick = copyScore;
  $('share').onclick = async () => {
    if (!current || busy) return;
    if (!supportsShare) return copyScore();
    busy = true; $('share').disabled = true; status('');
    try {
      // File is prepared when results open, preserving the click's user activation.
      const payload = {title: current.title, text: current.text, url: current.url};
      if (file && navigator.canShare?.({files: [file]})) payload.files = [file];
      await navigator.share(payload);
      status('Share menu closed. Your score is ready to share again.');
    } catch (error) {
      if (error.name !== 'AbortError') {
        status('Sharing is unavailable here. Use X, WhatsApp, copy, or save the card below.');
      }
    } finally { busy = false; $('share').disabled = false; }
  };

  return {
    prepare(round) {
      const ticket = ++generation;
      current = buildShareResult(round, location.href);
      file = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null;
      status(''); $('share-fallback').hidden = true;
      $('scorecard-preview').hidden = true;
      $('scorecard-preview').open = false;
      $('scorecard-image').removeAttribute('src');
      $('save-scorecard').hidden = true;
      $('save-scorecard').removeAttribute('href');
      $('score-tiles').replaceChildren(...current.points.map(points => {
        const tile = document.createElement('span');
        tile.dataset.band = scoreBand(points);
        tile.textContent = points.toLocaleString('en-US');
        tile.setAttribute('aria-hidden', 'true');
        return tile;
      }));
      $('score-tiles').setAttribute('aria-label', `Question scores: ${current.points.join(', ')} points`);
      $('share-assists').textContent = current.assistLabel;
      const links = platformLinks(current);
      $('share-x').href = links.x; $('share-whatsapp').href = links.whatsapp;
      const result = current;
      createScorecard(result).then(blob => {
        if (ticket !== generation) return;
        objectUrl = URL.createObjectURL(blob);
        file = new File([blob], result.filename, {type: 'image/png'});
        $('save-scorecard').href = objectUrl;
        $('save-scorecard').download = result.filename;
        $('save-scorecard').hidden = false;
        $('scorecard-image').src = objectUrl;
        $('scorecard-image').alt = `Geo Football ${result.practice ? 'training' : 'daily'} scorecard for ${result.date}: ${result.formattedScore} out of 5,000. ${result.assistLabel}.`;
        $('scorecard-preview').hidden = false;
      }).catch(() => {
        if (ticket === generation) status('The image could not be created. You can still share your score as text.');
      });
    },
  };
}
