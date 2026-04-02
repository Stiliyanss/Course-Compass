import { Link } from 'react-router-dom';
import { Lightbulb, Rocket, Users, DollarSign, ArrowRight } from 'lucide-react';
import Button from './ui/Button';

const perks = [
  {
    icon: Rocket,
    title: 'Launch your own courses',
    description: 'Create and publish courses with materials, set your own price, and go live.',
  },
  {
    icon: Users,
    title: 'Reach a growing audience',
    description: 'Students are actively looking for new courses — your expertise could be exactly what they need.',
  },
  {
    icon: DollarSign,
    title: 'Earn from your knowledge',
    description: 'Get paid for every enrollment. Your knowledge has real value — start monetizing it.',
  },
];

export default function BecomeInstructor() {
  return (
    <section className="relative overflow-hidden border-t border-slate-800 py-20">
      {/* Background accents */}
      <div className="absolute top-0 right-1/4 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30 p-10 md:p-14">
          <div className="grid items-center gap-10 md:grid-cols-2">
            {/* Left side — message */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-400">
                <Lightbulb className="h-4 w-4" />
                Share your knowledge
              </div>
              <h2
                className="text-3xl font-bold text-white md:text-4xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Got expertise?
                <br />
                <span className="bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent">
                  Teach the world.
                </span>
              </h2>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Turn your skills into courses and reach students everywhere.
                Apply to become an instructor and start building your teaching career on Course Compass.
              </p>
              <Link to="/student/apply-instructor" className="mt-8 inline-block">
                <Button className="bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 px-8 py-3 text-base">
                  Apply Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Right side — perks */}
            <div className="space-y-6">
              {perks.map((perk) => (
                <div key={perk.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <perk.icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{perk.title}</h3>
                    <p className="mt-1 text-sm text-gray-400">{perk.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
