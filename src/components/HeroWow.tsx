"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Leaf, Store, ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, duration: 0.6 } }),
};

export default function HeroWow() {
  return (
    <section className="bg-aurora">
      <div className="card p-8 md:p-10 relative overflow-hidden">
        {/* subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative grid gap-8 lg:grid-cols-5 lg:items-center">
          <div className="lg:col-span-3">
            <motion.div
              className="chip mb-4 inline-flex"
              style={{
                borderColor: "hsl(var(--primary) / 0.25)",
                background: "hsl(var(--primary) / 0.08)",
              }}
              initial="hidden"
              animate="show"
              custom={0}
              variants={fadeUp}
            >
              <Sparkles size={14} />
              New: Launching store-by-store in PH
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05]"
              initial="hidden"
              animate="show"
              custom={1}
              variants={fadeUp}
            >
              Rescue surplus food.
              <br />
              <span style={{ color: "hsl(var(--primary))" }}>Pay less</span> today.
            </motion.h1>

            <motion.p
              className="mt-4 text-base md:text-lg muted max-w-xl"
              initial="hidden"
              animate="show"
              custom={2}
              variants={fadeUp}
            >
              Premium bundles from restaurants & shops — reserved in seconds. You get a code, you pick up during the window.
            </motion.p>

            <motion.div
              className="mt-6 flex flex-wrap gap-3"
              initial="hidden"
              animate="show"
              custom={3}
              variants={fadeUp}
            >
              <Link className="btn btn-primary shine" href="/deals">
                Browse deals <ArrowRight size={16} />
              </Link>
              <Link className="btn btn-ghost" href="/stores/apply">
                For stores <Store size={16} />
              </Link>
            </motion.div>

            <motion.div
              className="mt-6 flex flex-wrap gap-2"
              initial="hidden"
              animate="show"
              custom={4}
              variants={fadeUp}
            >
              <span className="chip"><Leaf size={14} /> Less waste</span>
              <span className="chip">Instant reserve code</span>
              <span className="chip">Pick up in-store</span>
            </motion.div>
          </div>

          <div className="lg:col-span-2">
            <motion.div
              className="card-soft p-6 md:p-7"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12 }}
            >
              <div className="text-sm font-extrabold">How it works</div>

              <div className="mt-5 grid gap-4">
                {[
                  { n: "1", t: "Find a deal", d: "Browse bundles near you." },
                  { n: "2", t: "Reserve", d: "Get your code instantly." },
                  { n: "3", t: "Pick up", d: "Show code during the window." },
                ].map((x, i) => (
                  <motion.div
                    key={x.n}
                    className="flex gap-3"
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 350, damping: 24 }}
                  >
                    <span className="chip">{x.n}</span>
                    <div>
                      <div className="font-semibold">{x.t}</div>
                      <div className="text-sm muted">{x.d}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div
                className="mt-6 rounded-3xl border p-5"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--surface))" }}
              >
                <div className="text-sm font-semibold">
                  <span style={{ color: "hsl(var(--accent))" }}>★</span> Built for restaurants
                </div>
                <div className="text-sm muted mt-1">
                  Post deals in 30 seconds. Track reservations. Reduce waste.
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}