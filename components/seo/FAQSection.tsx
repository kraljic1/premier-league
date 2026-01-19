"use client";

import { getCurrentSeasonShort } from "@/lib/utils/season-utils";

interface FAQItem {
  question: string;
  answer: string;
}

/**
 * FAQ Section component for voice search optimization
 * Uses semantic HTML and speakable content for better SEO
 */
export function FAQSection() {
  const currentSeason = getCurrentSeasonShort();

  const faqs: FAQItem[] = [
    {
      question: "What is the Premier League?",
      answer: `The Premier League is the top level of the English football league system. The ${currentSeason} season features 20 teams competing for the championship title. It's one of the most watched football leagues in the world.`
    },
    {
      question: "How can I track Premier League fixtures?",
      answer: "You can track Premier League fixtures, results, and standings on Premier League Tracker. View upcoming matches, check recent results with live scores, and compare team schedules to plan your match viewing."
    },
    {
      question: "Where can I see Premier League standings?",
      answer: `View the current Premier League standings table for the ${currentSeason} season on our standings page. Check points, goal difference, wins, losses, and draws for all teams in real-time.`
    },
    {
      question: "How do I compare Premier League fixtures?",
      answer: "Use our Compare Fixtures tool to see side-by-side schedules for different clubs. This helps you plan which matches to watch and identify key fixtures in the season."
    },
    {
      question: "Can I compare team performance across seasons?",
      answer: `Yes! Our Season Comparison tool allows you to analyze how teams performed in different seasons. Compare points, goals scored, and other statistics to see team progress over time.`
    },
    {
      question: "When does the Premier League season start?",
      answer: `The Premier League ${currentSeason} season typically runs from August to May, with matches played on weekends and some midweek fixtures. Check our fixtures page for the complete schedule.`
    }
  ];

  return (
    <section 
      className="mt-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 speakable-content">
        Frequently Asked Questions
      </h2>
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0"
            itemScope
            itemType="https://schema.org/Question"
          >
            <h3 
              className="text-lg font-semibold text-gray-900 dark:text-white mb-2 speakable-content"
              itemProp="name"
            >
              {faq.question}
            </h3>
            <div
              itemScope
              itemType="https://schema.org/Answer"
            >
              <p 
                className="text-gray-600 dark:text-gray-400 speakable-content"
                itemProp="text"
              >
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
