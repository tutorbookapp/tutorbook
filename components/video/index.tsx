import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import cn from 'classnames';

import FullScreenIcon from 'components/icons/full-screen';
import PauseIcon from 'components/icons/pause';
import PlayIcon from 'components/icons/play';

import styles from './video.module.scss';

/**
 * Pads a given number with leading zeros until it reaches a certain length.
 * @param num - The number to pad.
 * @param size - The desired number of digits.
 * @return The padded number. Note that if the given `num` already has a length
 * equal to or greater than the requested `size`, nothing will happen.
 * @see {@link https://stackoverflow.com/a/2998822}
 */
function pad(num: number, size: number): string {
  let str = num.toString();
  while (str.length < size) str = `0${str}`;
  return str;
}

/**
 * Converts milliseconds to a readable timestamp.
 * @param seconds - The seconds to convert into a timestamp.
 * @return The formatted timestamp (MM:SS).
 * @example
 * secondsToTimestamp(24.78); // Returns '00:25'
 */
function secondsToTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${pad(mins, 2)}:${pad(secs, 2)}`;
}

function toggleSelection(value: string): void {
  const style = (document.body.style as unknown) as Record<string, string>;
  style['user-select'] = value;
  style['-webkit-user-select'] = value;
  style['-moz-user-select'] = value;
  style['-ms-user-select'] = value;
}

async function loadMedia(video: HTMLVideoElement, src: string): Promise<void> {
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    /* eslint-disable-next-line no-param-reassign */
    video.src = src;
  } else {
    const { default: Hls } = await import('hls.js');
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    }
  }
}

export interface VideoProps {
  id: string;
  autoplay?: boolean;
  loop?: boolean;
}

export default function Video({ id, autoplay, loop }: VideoProps): JSX.Element {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    void loadMedia(ref.current, `https://stream.mux.com/${id}.m3u8`);
  }, [ref, id]);

  const [visible, setVisible] = useState<boolean>(false);
  const onEnter = useCallback(() => setVisible(true), []);
  const onLeave = useCallback(() => setVisible(false), []);

  const [playing, setPlaying] = useState<boolean>(autoplay || false);
  const togglePlayback = useCallback(async () => {
    if (!ref.current) return;
    if (ref.current.paused) {
      await ref.current.play();
      setPlaying(true);
    } else {
      ref.current.pause();
      setPlaying(false);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (ref.current) await ref.current.requestFullscreen();
  }, []);

  const [progress, setProgress] = useState<number>(0);
  const [dragging, setDragging] = useState<boolean>(false);
  const updateProgress = useCallback(() => {
    if (dragging || !ref.current?.currentTime || !ref.current?.duration) return;
    setProgress(ref.current.currentTime / ref.current.duration);
  }, [dragging]);

  useEffect(() => {
    if (!ref.current || !ref.current.duration) return;
    const updated = progress * ref.current.duration;
    if (progress === 1) setPlaying(false);
    if (Math.round(updated) === Math.round(ref.current.currentTime)) return;
    ref.current.currentTime = progress * ref.current.duration;
  }, [progress]);

  const updateDrag = useCallback(
    (event: MouseEvent) => {
      if (!dragging) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const updated = (event.clientX - bounds.left) / bounds.width;
      setProgress(Math.min(1, Math.max(0, updated)));
    },
    [dragging]
  );
  const endDrag = useCallback(
    (event: MouseEvent) => {
      setDragging(false);
      toggleSelection('');
      updateDrag(event);
    },
    [updateDrag]
  );
  const startDrag = useCallback(
    (event: MouseEvent) => {
      setDragging(true);
      toggleSelection('none');
      updateDrag(event);
    },
    [updateDrag]
  );

  return (
    <figure
      className={styles.wrapper}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className={styles.main}>
        <div className={styles.container}>
          <video
            ref={ref}
            onTimeUpdate={updateProgress}
            onDurationChange={updateProgress}
            autoPlay={autoplay}
            preload='auto'
            loop={loop}
            playsInline
          />
          <div className={cn(styles.controls, { [styles.visible]: visible })}>
            <button
              className={styles.play}
              type='button'
              onClick={togglePlayback}
            >
              {playing && <PauseIcon />}
              {!playing && <PlayIcon />}
            </button>
            <div className={styles.time}>
              {secondsToTimestamp(ref.current?.currentTime || 0)}
            </div>
            <div className={styles.progress}>
              <div
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onMouseDown={startDrag}
                onMouseMove={updateDrag}
                className={styles.dragHandler}
              />
              <progress value={progress * 100} max='100' />
              <div
                style={{ left: `${progress * 100}%` }}
                className={styles.handle}
              />
            </div>
            <div className={styles.time}>
              {secondsToTimestamp(ref.current?.duration || 0)}
            </div>
            <button
              className={styles.fullscreen}
              type='button'
              onClick={toggleFullscreen}
            >
              <FullScreenIcon />
            </button>
          </div>
        </div>
      </div>
    </figure>
  );
}
