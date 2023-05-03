import axios from 'axios';
import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';
import type { CDNData } from '../types';
import * as userAgents from '../user-agents';

export async function directExtract(url: string) {
  let cdnData: CDNData | null = null;

  await axios.get('https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(url))
    .then(res => {
      const html = res.data;

      if (html.includes('.mp4'))
        cdnData = extractFullFromHtml(html)
    })
    .catch(() => { });

  return cdnData;
}

export async function reelExtract(url: string) {
  let cdnData: CDNData | null = null;

  if (url.includes('reel')) {
    await axios.get(url)
      .then(async res => {
        const html = res.data;
        const $ = cheerio.load(html);
        const act = $('form#login_form').attr('action')!;
        url = decodeURIComponent(act.replace('/login/device-based/regular/login/?next=', '')).split('?')[0]
      })
      .catch(() => url = '');
  }

  if (url.length > 0) {
    await axios.get('https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(url))
      .then(res => {
        const html = res.data;

        if (html.includes('.mp4'))
          cdnData = extractFullFromHtml(html)
      })
      .catch(() => { });
  }

  return cdnData;
}

export async function metaOgExtract(url: string) {
  let cdnData: CDNData | null = null;

  await axios.get(url, { headers: { 'User-Agent': userAgents.ios() } })
    .then(async res => {
      const html = res.data;
      const $ = cheerio.load(html);

      const ogUrl = $('meta[property="og:url"]');
      if (ogUrl.attr('content')) {
        await axios.get('https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(ogUrl.attr('content')!))
          .then(res => {
            const html = res.data;

            if (html.includes('.mp4')) {
              cdnData = extractFullFromHtml(html);
            }
          })
          .catch(() => { })
      }
    });

  return cdnData;
}

export async function groupPostExtract(url: string) {
  let cdnData: CDNData | null = null;

  await axios.get(url, { headers: { 'User-Agent': userAgents.ios() } })
    .then(async res => {
      const html = res.data;
      const $ = cheerio.load(html);

      if (url.includes('groups') && url.includes('multi_permalinks')) {
        const videoId = url.match(/multi_permalinks=\d+/g)![0].replace('multi_permalinks=', '');
        const pageCanonical = $('link[rel="canonical"]').attr('href')!;
        const allegedlyUrl = `${pageCanonical.replace('groups/', '')}posts/${videoId}`;

        await axios.get('https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(allegedlyUrl))
          .then(res => {
            const html = res.data;

            if (html.includes('.mp4')) {
              cdnData = extractFullFromHtml(html);
            }
          })
          .catch(() => { })
      }
    });

  return cdnData;
}

export async function dataStoreElementExtract(url: string) {
  let cdnData: CDNData | null = null;

  await axios.get(url, { headers: { 'User-Agent': userAgents.ios() } })
    .then(async res => {
      const html = res.data;
      const $ = cheerio.load(html);
      const dataStoreEl = $('[data-store*=.mp4]');
      if (dataStoreEl.attr('data-store')) {
        // has data-store element, can directly get cdn
        const dataStore = JSON.parse(dataStoreEl.attr('data-store')!);
        cdnData = {
          hdSrc: undefined,
          sdSrc: undefined,
          sdSrcNoRateLimit: dataStore.src, // data-store only have no rate limit sd source
        }
      }
    });

  return cdnData;
}

export async function specificUAExtract(
  url: string,
  ua?: 'macos_10_15_7'
) {
  let cdnData: CDNData | null = null;
  let userAgent: string = userAgents.random();

  // using specific user agents to get element data-store to appear
  if (ua) {
    switch (ua) {
      case 'macos_10_15_7':
        userAgent = userAgents.macos_specific_a(); break;
    }
  }

  await axios.get(url, { headers: { 'User-Agent': userAgents.ios() } })
    .then(async res => {
      const html = res.data;
      const $ = cheerio.load(html);
      const dataStoreEl = $('[data-store*=.mp4]');
      if (dataStoreEl.attr('data-store')) {
        // has data-store element, can directly get cdn
        const dataStore = JSON.parse(dataStoreEl.attr('data-store')!);
        cdnData = {
          hdSrc: undefined,
          sdSrc: undefined,
          sdSrcNoRateLimit: dataStore.src, // data-store only have no rate limit sd source
        }
      }
    });

  return cdnData;
}

export function extractFullFromHtml(html: string): CDNData {
  const hdSrc = html.match(/(\"hd_src\"\:\")([\s\S]*?)(\",)/g)?.[0].replace('"hd_src":"', '').slice(0, -2).replaceAll('\\u0025', '%').replaceAll('\\/', '/');
  const sdSrc = html.match(/(\"sd_src\"\:\")([\s\S]*?)(\",)/)?.[0].replace('"sd_src":"', '').slice(0, -2).replaceAll('\\/', '/');
  const sdSrcNoRateLimit = html.match(/(\"sd_src_no_ratelimit\"\:\")([\s\S]*?)(\",)/)?.[0].replace('"sd_src_no_ratelimit":"', '').slice(0, -2).replaceAll('\\/', '/')!;

  return {
    hdSrc,
    sdSrc,
    sdSrcNoRateLimit
  }
}