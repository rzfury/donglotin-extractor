import {
  dataStoreElementExtract,
  directExtract,
  groupPostExtract,
  metaOgExtract,
  reelExtract,
  specificUAExtract,
} from '../src/extractor';
import samples from '../samples';
import { CDNData } from '../types';

describe('Extract with `plugin/video.php` directly.', async function () {
  this.timeout(30000);


  for (const sample of samples.regular) {
    it('sample: ' + sample, function () {
      return new Promise<void>(async (resolve, reject) => {
        let cdn: CDNData | null = null;
        if (sample.includes('reel')) {
          const cdn = await reelExtract(sample);
          if (cdn) return resolve();
        }

        cdn = await directExtract(sample);
        if (cdn) return resolve();

        cdn = await groupPostExtract(sample);
        if (cdn) return resolve();

        cdn = await metaOgExtract(sample);
        if (cdn) return resolve();

        cdn = await dataStoreElementExtract(sample);
        if (cdn) return resolve();

        cdn = await specificUAExtract(sample, 'macos_10_15_7');
        if (cdn) return resolve();

        cdn = await specificUAExtract(sample, 'ios_16_3_1_safari_604_1');
        if (cdn) return resolve();

        reject();
      });
    });
  }
});
