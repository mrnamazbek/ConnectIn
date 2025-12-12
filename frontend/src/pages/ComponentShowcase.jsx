import React, { useState } from 'react';
import { GlassCard, GlassButton, GlassInput, SkillChip, GlassModal } from '../components/ui';

/**
 * Component Library Showcase
 * Demonstrates all glassmorphism components for developer reference
 */
const ComponentShowcase = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    const skills = ['React', 'Python', 'FastAPI', 'PostgreSQL', 'AWS', 'Docker'];

    const handleButtonClick = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
    };

    return (
        <div className="min-h-screen p-8 md:p-12">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-display text-glass">
                        Glassmorphism Components
                    </h1>
                    <p className="text-body-lg text-secondary max-w-2xl mx-auto">
                        Premium UI components with liquid-glass effects and neon accents
                    </p>
                </div>

                {/* Cards Section */}
                <section className="space-y-6">
                    <h2 className="text-h2 text-neon">Glass Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <GlassCard variant="default" className="p-6 space-y-3">
                            <h3 className="text-h3">Default Card</h3>
                            <p className="text-body text-secondary">
                                Standard glassmorphism card with frosted glass effect and subtle hover animation.
                            </p>
                        </GlassCard>

                        <GlassCard variant="highlighted" className="p-6 space-y-3">
                            <h3 className="text-h3 text-neon">Highlighted Card</h3>
                            <p className="text-body text-secondary">
                                Featured card with neon aqua border and glow effect.
                            </p>
                        </GlassCard>

                        <GlassCard
                            variant="interactive"
                            className="p-6 space-y-3"
                            onClick={() => alert('Card clicked!')}
                        >
                            <h3 className="text-h3">Interactive Card</h3>
                            <p className="text-body text-secondary">
                                Clickable card with scale animation on hover. Try clicking me!
                            </p>
                        </GlassCard>
                    </div>
                </section>

                {/* Buttons Section */}
                <section className="space-y-6">
                    <h2 className="text-h2 text-neon">Glass Buttons</h2>
                    <div className="flex flex-wrap gap-4">
                        <GlassButton variant="primary">
                            Primary Button
                        </GlassButton>
                        <GlassButton variant="secondary">
                            Secondary Button
                        </GlassButton>
                        <GlassButton variant="ghost">
                            Ghost Button
                        </GlassButton>
                        <GlassButton variant="primary" disabled>
                            Disabled Button
                        </GlassButton>
                        <GlassButton
                            variant="primary"
                            loading={loading}
                            onClick={handleButtonClick}
                        >
                            {loading ? 'Loading...' : 'Click to Load'}
                        </GlassButton>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <GlassButton variant="primary" size="sm">
                            Small
                        </GlassButton>
                        <GlassButton variant="primary" size="md">
                            Medium
                        </GlassButton>
                        <GlassButton variant="primary" size="lg">
                            Large
                        </GlassButton>
                    </div>
                </section>

                {/* Inputs Section */}
                <section className="space-y-6">
                    <h2 className="text-h2 text-neon">Glass Inputs</h2>
                    <div className="max-w-md space-y-4">
                        <GlassInput
                            label="Username"
                            placeholder="Enter your username"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            required
                        />
                        <GlassInput
                            label="Email"
                            type="email"
                            placeholder="your@email.com"
                            icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            }
                        />
                        <GlassInput
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            error="Password must be at least 8 characters"
                        />
                    </div>
                </section>

                {/* Skill Chips Section */}
                <section className="space-y-6">
                    <h2 className="text-h2 text-neon">Skill Chips</h2>
                    <div className="flex flex-wrap gap-3">
                        {skills.map((skill, index) => (
                            <SkillChip
                                key={skill}
                                label={skill}
                                variant={['blue', 'aqua', 'lime', 'purple'][index % 4]}
                            />
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {['JavaScript', 'TypeScript', 'Node.js'].map((skill) => (
                            <SkillChip
                                key={skill}
                                label={skill}
                                variant="aqua"
                                onRemove={() => alert(`Removed ${skill}`)}
                            />
                        ))}
                    </div>
                </section>

                {/* Modal Section */}
                <section className="space-y-6">
                    <h2 className="text-h2 text-neon">Glass Modal</h2>
                    <GlassButton onClick={() => setModalOpen(true)}>
                        Open Modal
                    </GlassButton>

                    <GlassModal
                        isOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        title="Premium Modal Dialog"
                        size="md"
                    >
                        <div className="space-y-4">
                            <p className="text-body text-secondary">
                                This is a glassmorphism modal with backdrop blur and smooth animations.
                            </p>
                            <GlassCard className="p-4">
                                <p className="text-body-sm text-secondary">
                                    Glass components can be nested within modals
                                </p>
                            </GlassCard>
                            <div className="flex gap-3 justify-end">
                                <GlassButton variant="ghost" onClick={() => setModalOpen(false)}>
                                    Cancel
                                </GlassButton>
                                <GlassButton variant="primary" onClick={() => setModalOpen(false)}>
                                    Confirm
                                </GlassButton>
                            </div>
                        </div>
                    </GlassModal>
                </section>

                {/* Animations Section */}
                <section className="space-y-6">
                    <h2 className="text-h2 text-neon">Animations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <GlassCard className="p-6 animate-float">
                            <h3 className="text-h3">Float Animation</h3>
                            <p className="text-body-sm text-secondary">Smooth floating effect</p>
                        </GlassCard>

                        <GlassCard className="p-6 animate-pulse-glow">
                            <h3 className="text-h3 text-neon">Pulse Glow</h3>
                            <p className="text-body-sm text-secondary">Pulsing neon glow</p>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <div className="animate-shimmer h-8 rounded-lg" />
                            <p className="text-body-sm text-secondary mt-3">Shimmer effect</p>
                        </GlassCard>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ComponentShowcase;
