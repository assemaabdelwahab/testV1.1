"use client";

import { useState } from "react";

type Personality = "Bold Adventurer" | "Cozy Classic" | "Sweet Enthusiast" | "Zen Minimalist";

interface Question {
  question: string;
  answers: {
    text: string;
    personality: Personality;
  }[];
}

const questions: Question[] = [
  {
    question: "How do you start your morning?",
    answers: [
      { text: "Jump out of bed ready to conquer the day", personality: "Bold Adventurer" },
      { text: "Ease into it with a calm routine", personality: "Zen Minimalist" },
      { text: "Snuggle under the covers a bit longer", personality: "Cozy Classic" },
      { text: "Check my phone and plan something fun", personality: "Sweet Enthusiast" },
    ],
  },
  {
    question: "What's your ideal weekend activity?",
    answers: [
      { text: "Trying a new adventure sport", personality: "Bold Adventurer" },
      { text: "Reading a book by the fireplace", personality: "Cozy Classic" },
      { text: "Baking treats for friends", personality: "Sweet Enthusiast" },
      { text: "A quiet walk in nature", personality: "Zen Minimalist" },
    ],
  },
  {
    question: "How do you handle stress?",
    answers: [
      { text: "Channel it into intense exercise", personality: "Bold Adventurer" },
      { text: "Curl up with comfort food and a movie", personality: "Cozy Classic" },
      { text: "Treat myself to something sweet", personality: "Sweet Enthusiast" },
      { text: "Meditate or practice deep breathing", personality: "Zen Minimalist" },
    ],
  },
  {
    question: "What's your social style?",
    answers: [
      { text: "Life of the party, always up for anything", personality: "Bold Adventurer" },
      { text: "Prefer small gatherings with close friends", personality: "Cozy Classic" },
      { text: "Love hosting and making people happy", personality: "Sweet Enthusiast" },
      { text: "Enjoy meaningful one-on-one conversations", personality: "Zen Minimalist" },
    ],
  },
  {
    question: "How do you approach new experiences?",
    answers: [
      { text: "Dive in headfirst without hesitation", personality: "Bold Adventurer" },
      { text: "Stick to what I know and love", personality: "Cozy Classic" },
      { text: "If it sounds fun, I'm in!", personality: "Sweet Enthusiast" },
      { text: "Consider it thoughtfully first", personality: "Zen Minimalist" },
    ],
  },
  {
    question: "What's your workspace vibe?",
    answers: [
      { text: "High-energy, fast-paced environment", personality: "Bold Adventurer" },
      { text: "Comfortable and familiar surroundings", personality: "Cozy Classic" },
      { text: "Colorful and cheerful atmosphere", personality: "Sweet Enthusiast" },
      { text: "Minimal and distraction-free space", personality: "Zen Minimalist" },
    ],
  },
];

const personalities = {
  "Bold Adventurer": {
    tagline: "You live for intensity",
    recommendation: "Double Espresso",
  },
  "Cozy Classic": {
    tagline: "You cherish warmth and comfort",
    recommendation: "Cappuccino",
  },
  "Sweet Enthusiast": {
    tagline: "You embrace joy and sweetness",
    recommendation: "Caramel Macchiato",
  },
  "Zen Minimalist": {
    tagline: "You value simplicity and calm",
    recommendation: "Pour Over",
  },
};

export default function Home() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Personality[]>([]);
  const [result, setResult] = useState<Personality | null>(null);

  const handleStart = () => {
    setStarted(true);
    setCurrentQuestion(0);
    setAnswers([]);
    setResult(null);
  };

  const handleAnswer = (personality: Personality) => {
    const newAnswers = [...answers, personality];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate result
      const counts: Record<Personality, number> = {
        "Bold Adventurer": 0,
        "Cozy Classic": 0,
        "Sweet Enthusiast": 0,
        "Zen Minimalist": 0,
      };

      newAnswers.forEach((answer) => {
        counts[answer]++;
      });

      // Find the personality with the highest count
      let maxCount = 0;
      let winner: Personality = "Bold Adventurer";

      (Object.keys(counts) as Personality[]).sort().forEach((personality) => {
        if (counts[personality] > maxCount) {
          maxCount = counts[personality];
          winner = personality;
        }
      });

      setResult(winner);
    }
  };

  const handleRetake = () => {
    setStarted(false);
    setCurrentQuestion(0);
    setAnswers([]);
    setResult(null);
  };

  // Welcome Screen
  if (!started) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-5xl font-bold mb-4">What's Your Coffee Personality?</h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover which coffee drink matches your unique personality. Answer 6 quick questions to find your perfect brew!
          </p>
          <button
            onClick={handleStart}
            className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Start Quiz
          </button>
        </div>
      </main>
    );
  }

  // Results Screen
  if (result) {
    const personalityInfo = personalities[result];
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-5xl font-bold mb-4">{result}</h1>
          <p className="text-2xl text-gray-600 mb-6">{personalityInfo.tagline}</p>
          <div className="bg-white rounded-lg p-8 shadow-lg mb-8">
            <p className="text-gray-600 mb-2">Your perfect coffee:</p>
            <p className="text-3xl font-bold">{personalityInfo.recommendation}</p>
          </div>
          <button
            onClick={handleRetake}
            className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Retake Quiz
          </button>
        </div>
      </main>
    );
  }

  // Question Screen
  const question = questions[currentQuestion];
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">
            Question {currentQuestion + 1} of {questions.length}
          </p>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div
              className="bg-gray-900 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-8">{question.question}</h2>

        <div className="space-y-4">
          {question.answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(answer.personality)}
              className="w-full bg-white p-6 rounded-lg text-left hover:bg-gray-100 transition-colors border-2 border-gray-200 hover:border-gray-900"
            >
              <p className="text-lg">{answer.text}</p>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
