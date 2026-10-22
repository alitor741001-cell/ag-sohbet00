const ROOT = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/';
const frames = [
  { image_url: ROOT+'fdaaed087_IMG_0091.jpg', crop:{x:.29,y:.18,w:.44,h:.37} },
  { image_url: ROOT+'f4665087d_IMG_0090.jpg', crop:{x:.32,y:.25,w:.38,h:.31} },
  { image_url: ROOT+'6c6b6b8c7_IMG_0089.jpg', crop:{x:.27,y:.20,w:.48,h:.44} },
  { image_url: ROOT+'f29e149e1_IMG_0088.jpg', crop:{x:.33,y:.24,w:.33,h:.31} },
  { image_url: ROOT+'b558483d7_IMG_0087.jpg', crop:{x:.26,y:.16,w:.54,h:.44} },
];
export default function vipFrameArt(level) {
  const index = {5:0,6:1,7:2,8:3,9:0,10:2,11:1,12:4}[level];
  return index === undefined ? null : { ...frames[index], name: `VIP ${level} avatar çerçevesi`, remove_white: true };
}