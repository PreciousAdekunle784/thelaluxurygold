/**
 * SAMPLE TESTIMONIALS — development placeholders only.
 * They are deliberately anonymous and labelled in the UI. Replace with verified
 * client feedback (with permission) before launch, and set isSample to false.
 */
export interface Testimonial {
  quote: string;
  attribution: string;
  isSample: boolean;
}

export const testimonials: Testimonial[] = [
  {
    quote: "Placeholder testimonial — a verified client's words about the quality of their piece will appear here.",
    attribution: "Client name · City",
    isSample: true,
  },
  {
    quote: "Placeholder testimonial — feedback about the ordering and delivery experience will appear here once supplied.",
    attribution: "Client name · City",
    isSample: true,
  },
  {
    quote: "Placeholder testimonial — a review describing the customer service received will appear here.",
    attribution: "Client name · City",
    isSample: true,
  },
];
