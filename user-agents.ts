import UserAgent from 'user-agents';

export function random() {
  return new UserAgent().toString();
}

export function ios() {  
  return new UserAgent({ deviceCategory: 'mobile', platform: 'iPhone' }).toString();
}

export function macos_specific_a() {
  return new UserAgent(/Macintosh*.10_15_7*.Safari*.605.1.15/).toString();
}
