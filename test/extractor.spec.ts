import { directExtract } from '../src/extractor';
import samples from '../samples';

describe('Extract with video.plugin directly.', async function() {
  this.timeout(30000);

  for(const sample of samples.regular) {
    it('sample: ' + sample, function() {
      return new Promise<void>(async (resolve, reject) => {
        const cdn = await directExtract(sample);

        if (cdn) resolve();
        reject();
      })
    });
  }
});
