import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faMapMarkerAlt, faPhone } from "@fortawesome/free-solid-svg-icons";
import emailjs from "@emailjs/browser";

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Initialize EmailJS with your public key
        emailjs.init(import.meta.env.VITE_EMAIL_PUBLIC_KEY);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const templateParams = {
            from_name: formData.name,
            from_email: formData.email,
            subject: formData.subject,
            message: formData.message,
        };

        try {
            await emailjs.send(
                import.meta.env.VITE_EMAIL_SERVICE_KEY,
                import.meta.env.VITE_EMAIL_TEMPLATE_KEY,
                templateParams
            );
            setSubmitted(true);
            setFormData({
                name: "",
                email: "",
                subject: "",
                message: "",
            });
        } catch (err) {
            console.error("Failed to send email:", err);
            setError("Failed to send your message. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">Have questions or feedback? We&apos;d love to hear from you!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mb-4">
                        <FontAwesomeIcon icon={faEnvelope} size="lg" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Email</h3>
                    <p className="text-gray-600 dark:text-gray-400">support@connectin.dev</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mb-4">
                        <FontAwesomeIcon icon={faMapMarkerAlt} size="lg" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Location</h3>
                    <p className="text-gray-600 dark:text-gray-400">San Francisco, CA</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mb-4">
                        <FontAwesomeIcon icon={faPhone} size="lg" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Phone</h3>
                    <p className="text-gray-600 dark:text-gray-400">+1 (555) 123-4567</p>
                </div>
            </div>

            {submitted ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
                    <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">Message Sent!</h3>
                    <p className="text-gray-600 dark:text-gray-400">Thank you for reaching out. We&apos;ll get back to you as soon as possible.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Send us a message</h2>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Subject
                            </label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Message
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={5}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70">
                            {isSubmitting ? "Sending..." : "Send Message"}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ContactPage;
