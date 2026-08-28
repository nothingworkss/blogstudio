export type UploadedImage = {
  id: string;
  url: string;
  name: string;
  position_label?: string;
};

export type ImageObservation = {
  image_url: string;
  visible_products: string[];
  packaging: string;
  colors: string[];
  visible_text: string[];
  quantity: string;
  mood: string;
  caption: string;
  cautions: string[];
};
