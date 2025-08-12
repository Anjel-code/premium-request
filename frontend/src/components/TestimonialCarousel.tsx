import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    "name": "Alex Carter",
    "role": "Business Consultant",
    "content": "The classic design with the Arabic numerals is exactly what I was looking for. It's the perfect accessory to complete my professional look."
  },
  {
    "name": "Mark Evans",
    "role": "Financial Analyst",
    "content": "I'm impressed with the quality for the price. The stainless steel band feels solid and the quartz movement keeps perfect time."
  },
  {
    "name": "Jordan Lee",
    "role": "Architect",
    "content": "This watch has a timeless elegance that works for any occasion. The simple yet sophisticated style makes it a daily essential for me."
  },
  {
    "name": "Sarah Miller",
    "role": "Creative Director",
    "content": "The complete calendar feature is a nice touch. It's a functional and stylish piece that gets compliments every time I wear it."
  },
  {
    "name": "Ryan Scott",
    "role": "Marketing Manager",
    "content": "Professional and stylish. The details, like the fluted bezel and the clear glass face, make it look much more expensive than it is. Highly recommended."
  },
  {
    "name": "Emily Wilson",
    "role": "Entrepreneur",
    "content": "I bought this as a gift, and it was a huge hit. The recipient loved the classic design and the comfortable fit of the stainless steel band."
  },
  {
    "name": "James Thompson",
    "role": "Consultant",
    "content": "The personalized attention and quality of service exceeded all my expectations. Highly recommended!"
  }
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
            className="relative cursor-pointer z-0 border-0 shadow-elegant flex-shrink-0 w-80 transition-all duration-300 hover:z-10 hover:shadow-[0_0_15px_3px_hsl(var(--accent)/0.3)]"
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
