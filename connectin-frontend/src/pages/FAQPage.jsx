import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 py-5">
      <button
        className="flex justify-between items-center w-full text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{question}</h3>
        <FontAwesomeIcon
          icon={isOpen ? faChevronUp : faChevronDown}
          className="text-green-600 dark:text-green-400"
        />
      </button>
      {isOpen && (
        <div className="mt-4 text-gray-600 dark:text-gray-400 prose dark:prose-invert max-w-none">
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQPage = () => {
  const faqData = [
    {
      category: "Getting Started",
      items: [
        {
          question: "What is ConnectIn?",
          answer: (
            <p>
              ConnectIn is a platform designed specifically for developers to connect, collaborate, and showcase their projects. 
              Our platform makes it easy for developers to find teammates, mentors, and opportunities while building a professional 
              portfolio of their work.
            </p>
          ),
        },
        {
          question: "How do I create an account?",
          answer: (
            <p>
              To create an account, click on the "Register" button in the top right corner of the homepage. 
              Fill in your details including name, email, and password. You can also sign up using your GitHub account 
              for a faster registration process. Once registered, you'll be prompted to complete your profile.
            </p>
          ),
        },
        {
          question: "Is ConnectIn free to use?",
          answer: (
            <p>
              Yes! ConnectIn offers a free tier that provides access to all core features of the platform. 
              We may introduce premium features in the future, but our commitment is to keep the basic collaboration 
              and networking tools free for all developers.
            </p>
          ),
        },
      ],
    },
    {
      category: "Profile & Projects",
      items: [
        {
          question: "How do I showcase my projects?",
          answer: (
            <p>
              After logging in, navigate to your profile page and click on "Add Project." You can then fill in the details
              about your project including title, description, technologies used, and links to GitHub repositories or live demos.
              You can also upload screenshots and add team members who worked with you on the project.
            </p>
          ),
        },
        {
          question: "Can I import my GitHub projects automatically?",
          answer: (
            <p>
              Yes! ConnectIn allows you to connect your GitHub account and import repositories directly. 
              When adding a new project, select the "Import from GitHub" option and choose the repositories you want to showcase.
              We'll automatically fetch the description, languages used, and other relevant information.
            </p>
          ),
        },
        {
          question: "How do I update my skills and experience?",
          answer: (
            <p>
              Go to your profile page and click on the "Edit Profile" button. In the profile editor, you'll find sections for 
              skills, experience, education, and other professional information. You can add, remove, or update these details 
              at any time to keep your profile current.
            </p>
          ),
        },
      ],
    },
    {
      category: "Collaboration & Networking",
      items: [
        {
          question: "How do I find projects to collaborate on?",
          answer: (
            <p>
              You can discover projects looking for collaborators in several ways:
              <ul className="list-disc pl-5 mt-2">
                <li>Browse the "Discover" section for featured projects</li>
                <li>Use the search function with specific technologies or topics</li>
                <li>Check the "Collaboration Opportunities" tab for projects actively seeking contributors</li>
                <li>Follow developers in your area of interest to see their project updates</li>
              </ul>
            </p>
          ),
        },
        {
          question: "How do I message other developers?",
          answer: (
            <p>
              ConnectIn features a built-in messaging system. To contact another developer, visit their profile and click the 
              "Message" button. You can also initiate conversations from project pages or through the chat interface accessible 
              from the navigation bar.
            </p>
          ),
        },
        {
          question: "Can I create a team for my project?",
          answer: (
            <p>
              Absolutely! When creating or editing a project, you can add team members by searching for their ConnectIn username 
              or email. Team members can be assigned different roles (e.g., frontend developer, designer, project manager) and 
              permissions levels to reflect their contribution to the project.
            </p>
          ),
        },
      ],
    },
    {
      category: "Technical Support",
      items: [
        {
          question: "I found a bug on the platform. How do I report it?",
          answer: (
            <p>
              We appreciate bug reports! You can report issues by:
              <ul className="list-disc pl-5 mt-2">
                <li>Using the "Report Bug" option in the help menu</li>
                <li>Emailing our support team at support@connectin.dev</li>
                <li>Creating an issue on our <a href="https://github.com/connectin/platform-issues" className="text-green-600 hover:underline">GitHub repository</a> if you're technically inclined</li>
              </ul>
              Please include as much detail as possible about the bug and steps to reproduce it.
            </p>
          ),
        },
        {
          question: "How do I recover my password?",
          answer: (
            <p>
              If you've forgotten your password, click on the "Login" button and then select "Forgot Password" below the login form. 
              Enter the email address associated with your account, and we'll send you instructions to reset your password.
            </p>
          ),
        },
        {
          question: "Which browsers are supported?",
          answer: (
            <p>
              ConnectIn supports all modern browsers including:
              <ul className="list-disc pl-5 mt-2">
                <li>Google Chrome (recommended)</li>
                <li>Mozilla Firefox</li>
                <li>Safari</li>
                <li>Microsoft Edge</li>
              </ul>
              For the best experience, we recommend keeping your browser updated to the latest version.
            </p>
          ),
        },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mb-4">
          <FontAwesomeIcon icon={faQuestionCircle} size="2x" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Find answers to common questions about ConnectIn.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        {faqData.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-12 last:mb-0">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b border-green-500 pb-2">
              {category.category}
            </h2>
            <div className="space-y-0">
              {category.items.map((item, itemIndex) => (
                <FAQItem key={itemIndex} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Can't find what you're looking for? We're here to help!
        </p>
        <a
          href="/contact"
          className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default FAQPage; 