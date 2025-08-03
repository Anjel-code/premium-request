import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Technology Executive",
    content:
      "Absolutely exceptional service. They found exactly what I needed at a price I never could have negotiated myself.",
  },
  {
    name: "Michael Rodriguez",
    role: "Investment Manager",
    content:
      "The level of detail and care they put into each request is remarkable. Truly a premium experience.",
  },
  {
    name: "Emily Watson",
    role: "Creative Director",
    content:
      "They handle everything so professionally. I can't imagine going back to researching products myself.",
  },
  {
    name: "David Park",
    role: "Entrepreneur",
    content:
      "Outstanding results every time. Their expertise saved me countless hours and delivered exactly what I envisioned.",
  },
  {
    name: "Lisa Thompson",
    role: "Marketing Director",
    content:
      "The personalized attention and quality of service exceeded all my expectations. Highly recommended!",
  },
  {
    name: "James Wilson",
    role: "Consultant",
    content:
      "Professional, efficient, and incredibly thorough. This service has become essential for my business.",
  },
];

const TestimonialCarousel = () => {
  return (
    <div className="relative group">
      <style>
        {`
        @keyframes carousel-slide-reverse {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0%);
          }
        }
        `}
      </style>
      <div className="flex animate-[carousel-slide-reverse_60s_linear_infinite] group-hover:paused gap-8 w-max">
        {/* Duplicate testimonials for seamless loop */}
        {[...testimonials, ...testimonials].map((testimonial, index) => (
          <Card
            key={index}
            className="relative cursor-pointer z-0 border-0 shadow-elegant flex-shrink-0 w-80 transition-all duration-300 hover:z-10 hover:shadow-[0_0_15px_3px_rgba(230,172,16,0.7)]"
          >
            <CardContent className="p-8">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                "{testimonial.content}"
              </p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.role}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TestimonialCarousel;
