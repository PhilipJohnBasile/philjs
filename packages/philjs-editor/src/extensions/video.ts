/**
 * Video Extension with Embed Support
 *
 * Supports YouTube, Vimeo, and custom video embeds
 */

import Youtube from '@tiptap/extension-youtube';
import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Extract Vimeo video ID from URL
 */
function extractVimeoId(url: string): string | null {
  const match = url?.match(/vimeo\.com\/(\d+)/);
  return match?.[1] ?? null;
}

export interface VideoOptions {
  /**
   * Enable YouTube embeds
   */
  youtube?: boolean;
  /**
   * Enable Vimeo embeds
   */
  vimeo?: boolean;
  /**
   * Enable custom video embeds
   */
  customVideo?: boolean;
  /**
   * Default video width
   */
  width?: number;
  /**
   * Default video height
   */
  height?: number;
  /**
   * Allow fullscreen
   */
  allowFullscreen?: boolean;
  /**
   * Autoplay videos (muted)
   */
  autoplay?: boolean;
}

/**
 * Vimeo Extension
 */
export const Vimeo = Node.create({
  name: 'vimeo',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return {
      width: 640,
      height: 360,
      allowFullscreen: true,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: this.options.width,
      },
      height: {
        default: this.options.height,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-vimeo-video]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const videoId = extractVimeoId(HTMLAttributes['src']);
    const embedUrl = `https://player.vimeo.com/video/${videoId}`;

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-vimeo-video': '',
        class: 'philjs-video philjs-vimeo',
      }),
      [
        'iframe',
        {
          src: embedUrl,
          width: HTMLAttributes['width'],
          height: HTMLAttributes['height'],
          frameborder: '0',
          allow: 'autoplay; fullscreen; picture-in-picture',
          allowfullscreen: this.options.allowFullscreen,
        },
      ],
    ];
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCommands(): any {
    return {
      setVimeoVideo:
        (options: { src: string; width?: number; height?: number }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

/**
 * Custom Video Node for self-hosted videos
 */
export const CustomVideo = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return {
      width: '100%',
      height: 'auto',
      controls: true,
      autoplay: false,
      muted: false,
      loop: false,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      poster: {
        default: null,
      },
      width: {
        default: this.options.width,
      },
      height: {
        default: this.options.height,
      },
      controls: {
        default: this.options.controls,
      },
      autoplay: {
        default: this.options.autoplay,
      },
      muted: {
        default: this.options.muted,
      },
      loop: {
        default: this.options.loop,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { class: 'philjs-video philjs-custom-video' },
      [
        'video',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class: 'philjs-video-player',
        }),
      ],
    ];
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCommands(): any {
    return {
      setVideo:
        (options: {
          src: string;
          poster?: string;
          width?: string;
          height?: string;
          controls?: boolean;
          autoplay?: boolean;
          muted?: boolean;
          loop?: boolean;
        }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

/**
 * Create configured video extensions
 */
export function createVideoExtensions(options: VideoOptions = {}) {
  const {
    youtube = true,
    vimeo = true,
    customVideo = true,
    width = 640,
    height = 360,
    allowFullscreen = true,
  } = options;

  const extensions = [];

  if (youtube) {
    extensions.push(
      Youtube.configure({
        width,
        height,
        allowFullscreen,
        HTMLAttributes: {
          class: 'philjs-video philjs-youtube',
        },
      })
    );
  }

  if (vimeo) {
    extensions.push(
      Vimeo.configure({
        width,
        height,
        allowFullscreen,
      })
    );
  }

  if (customVideo) {
    extensions.push(CustomVideo);
  }

  return extensions;
}

/**
 * Detect video platform from URL
 */
export function detectVideoPlatform(
  url: string
): 'youtube' | 'vimeo' | 'custom' | null {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return 'custom';
  }
  return null;
}

/**
 * Insert video by URL (auto-detects platform)
 */
export function insertVideo(editor: any, url: string) {
  const platform = detectVideoPlatform(url);

  switch (platform) {
    case 'youtube':
      editor.commands.setYoutubeVideo({ src: url });
      break;
    case 'vimeo':
      editor.commands.setVimeoVideo({ src: url });
      break;
    case 'custom':
      editor.commands.setVideo({ src: url, controls: true });
      break;
    default:
      console.warn('Unknown video platform:', url);
  }
}

export { Youtube };
export default createVideoExtensions;
