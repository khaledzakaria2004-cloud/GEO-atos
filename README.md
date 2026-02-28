# 🏋️‍♂️ ATOS Fit: AI-Powered Fitness Coach

<div align="center">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg"/>
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img alt="TensorFlow" src="https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white"/>
  <img alt="Internet Computer" src="https://img.shields.io/badge/Internet%20Computer-3B00B9?style=for-the-badge&logo=dfinity&logoColor=white"/>
  <img alt="TailwindCSS" src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
</div>

---

> **ATOS Fit** is a next-generation fitness web app powered by **AI and computer vision**.
> It uses **TensorFlow.js** and **pose estimation** to analyze your workout form, count repetitions in real time, and provide instant feedback — all directly through your webcam.

<p align="center">
<img width="2400" height="1350" alt="ATOS fit Persentaion (2)" src="https://github.com/user-attachments/assets/b3bc3e93-cb79-4f7e-9a65-924bc4552b5f" />
</p>

---

## 🧠 Overview

ATOS Fit transforms your webcam into an **AI personal trainer**.
It’s a fully in-browser experience that analyzes your movements using advanced pose detection models — ensuring **accuracy, privacy, and motivation**.

---

## 🧆 Key Highlights

✅ **Real-Time Pose Detection** – Powered by MoveNet and TensorFlow.js for precise tracking.

✅ **Automatic Repetition Counting** – Smart algorithms based on joint angles & motion states.

✅ **Live Form Feedback** – Prevent injuries with real-time posture correction.

✅ **Custom Workouts** – Tailor exercises, sets, and reps to your fitness level.

✅ **Comprehensive Dashboard** – Track progress, calories, streaks, and more.

✅ **AI Food Scanner** – Instantly identify food and get nutritional info.

✅ **Integrated AI Assistant** – Your in-app fitness guide and knowledge hub.

✅ **Web3 + Decentralization** – Hosted on the Internet Computer for speed and security.

---

## 🔐 Privacy First

> Your data, your control.
> All video processing happens **locally** in your browser — nothing is uploaded.
> What happens on your machine **stays on your machine**.

---

## ⚙️ Technical Stack

| Category              | Technologies                      |
| --------------------- | --------------------------------- |
| **Frontend**          | React (Hooks & Context API), Vite |
| **AI**           | TensorFlow.js, MoveNet            |
| **Styling**           | Tailwind CSS, Shadcn UI           |
| **Backend & Hosting** | DFINITY Internet Computer         |
| **Database**          | Stable Memory              |
| **Routing**           | React Router DOM                  |

---

## 🏋️ Supported Exercises

| Exercise                   | Preview                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------ |
| Push-ups                   | ![](https://i.pinimg.com/originals/47/0d/31/470d318a551421e46c3891fb1f04dd50.gif)    |
| Squats                     | ![](https://i.pinimg.com/originals/27/30/c2/2730c2da52a5f9200caa7e5d8705efde.gif)    |
| Lunges                     | ![](https://i.pinimg.com/originals/66/78/58/6678589817d6026fab7bd23838a8e3eb.gif)    |
| Burpees                    | ![](https://i.pinimg.com/originals/f0/a3/da/f0a3da2890f6edf4c7b45845fa14e39c.gif)    |
| Mountain Climbers          | ![](https://i.pinimg.com/originals/bd/f2/a3/bdf2a3ec9beb4f231033af0d744057bb.gif)    |
| Jumping Jacks              | ![](https://i.pinimg.com/originals/b4/b5/b9/b4b5b94c119dde698d138b8fe0b8d521.gif)    |
| High Knees                 | ![](https://i.pinimg.com/originals/95/db/ae/95dbae82f51c67fc0f5aa30a57da663c.gif)    |
| Plank                      | ![](https://github.com/user-attachments/assets/7db97be8-551e-463e-ae78-4c0e47481adf) |
| Side Plank                 | ![](https://i.pinimg.com/736x/bd/cf/9a/bdcf9a908f66c3f28a47adc08a6c8448.jpg)         |
| Wall Sit                   | ![](https://i.pinimg.com/originals/50/bb/fa/50bbfa9d11ce94feff442ad0c1a3e250.gif)    |
| Knee Plank                 | ![](https://i.pinimg.com/originals/8d/51/1e/8d511edb34e36c468aef1027f7642621.gif)    |
| Knee Push Ups              | ![](https://i.pinimg.com/originals/f6/20/c9/f620c92cf9f2631338f51f711669d320.gif)    |
| Sit Ups                    | ![](https://i.pinimg.com/originals/53/05/a5/5305a5d4e53c24604ccdc1c1ba564561.gif)    |
| Reverse Straight Arm Plank | ![](https://i.pinimg.com/736x/37/ca/7e/37ca7ebf394ecc3df96f3c2c700f9738.jpg)         |
| Straight Arm Plank         | ![](https://i.pinimg.com/736x/d2/42/af/d242af1590d71c24ab930d6588f710d3.jpg)         |
| Reverse Plank              | ![](https://i.pinimg.com/736x/f4/1e/0f/f41e0f356b1cd9202ad0dda957cee97a.jpg)         |
| Wide Push Ups              | ![](https://i.pinimg.com/originals/47/0d/31/470d318a551421e46c3891fb1f04dd50.gif)    |
| Narrow Push Ups            | ![](https://i.pinimg.com/originals/47/0d/31/470d318a551421e46c3891fb1f04dd50.gif)    |
| Diamond Push Ups           | ![](https://i.pinimg.com/originals/47/0d/31/470d318a551421e46c3891fb1f04dd50.gif)    |

---

## 🧩 Project Structure

```bash
src/
├── components/      # Reusable UI components
├── contexts/        # Global React Contexts
├── pages/           # Top-level routes (Dashboard, Profile, etc.)
├── styles/          # Global and Tailwind styles
├── utils/           # Helpers, IndexedDB management
├── App.jsx          # Main entry component
├── index.jsx        # App bootstrap
└── Routes.jsx       # Routing configuration
```

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/en/) (v16+)
* [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Ma7moud12975/Fitness-Tracker-web-v1.git
cd Fitness-Tracker-web-v1

# 2. Install dependencies
npm install

# 3. Start Internet Computer replica
dfx start --background --clean

# 4. Deploy canisters locally
dfx deploy

# 5. Run development server
npm run dev
```

Now open `http://localhost:3000` in your browser 🎉

---

## 🌍 Inspiration

ATOS Fit was born from the idea that **AI can elevate personal fitness** — offering real-time guidance, precision tracking, and data-driven insights without expensive hardware.

> Built by a passionate team of AI, Web3, and computer vision experts — redefining the future of intelligent fitness.

---

## 🤝 Contributing

We welcome contributions!
If you’d like to enhance features or fix issues:

```bash
git checkout -b feature/YourFeature
# make your changes
git commit -m "Add: YourFeature"
git push origin feature/YourFeature
```

Then open a Pull Request 🚀

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <b>💪 ATOS Fit — Built for a smarter, healthier future.</b>
</p>
