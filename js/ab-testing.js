/* ============================================================
   NODEFORGE — A/B Testing Framework
   Lightweight, privacy-friendly A/B testing for CTA optimization
   ============================================================ */
(function () {
    'use strict';

    const AB_TESTS = {
        hero_cta_primary: {
            name: 'hero_cta_primary',
            variants: [
                { id: 'control', weight: 50, label: 'Обсудить проект' },
                { id: 'variant_a', weight: 50, label: 'Начать проект за 48ч' }
            ],
            cookieName: 'ab_hero_cta',
            cookieExpiry: 30
        },
        hero_cta_secondary: {
            name: 'hero_cta_secondary',
            variants: [
                { id: 'control', weight: 50, label: 'Как я работаю' },
                { id: 'variant_a', weight: 50, label: 'Смотреть кейсы' }
            ],
            cookieName: 'ab_hero_cta_secondary',
            cookieExpiry: 30
        },
        contact_cta: {
            name: 'contact_cta',
            variants: [
                { id: 'control', weight: 50, label: 'Написать в Telegram' },
                { id: 'variant_a', weight: 50, label: 'Получить прототип за 48ч' }
            ],
            cookieName: 'ab_contact_cta',
            cookieExpiry: 30
        },
        case_page_cta: {
            name: 'case_page_cta',
            variants: [
                { id: 'control', weight: 50, label: 'Заказать похожее' },
                { id: 'variant_a', weight: 50, label: 'Обсудить ваш проект' }
            ],
            cookieName: 'ab_case_cta',
            cookieExpiry: 30
        }
    };

    let clickHandler = null;
    let pagehideHandler = null;

    function getCookie(name) {
        try {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        } catch (e) {
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                console.warn('[AB Testing] Failed to read cookie:', e);
            }
        }
        return null;
    }

    function setCookie(name, value, days) {
        try {
            const expires = new Date(Date.now() + days * 864e5).toUTCString();
            const secure = location.protocol === 'https:' ? '; Secure' : '';
            document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax${secure}`;
        } catch (e) {
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                console.warn('[AB Testing] Failed to set cookie:', e);
            }
        }
    }

    function chooseVariant(testConfig) {
        if (!testConfig || !testConfig.variants || !testConfig.variants.length) {
            return null;
        }

        // Validate and normalize weights to sum to 100
        const totalWeight = testConfig.variants.reduce((sum, v) => sum + (v.weight || 0), 0);
        if (totalWeight !== 100) {
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                console.warn('[AB Testing] Weights do not sum to 100, normalizing:', testConfig.name, totalWeight);
            }
        }

        const stored = getCookie(testConfig.cookieName);
        if (stored && testConfig.variants.some(v => v.id === stored)) {
            return stored;
        }

        const rand = Math.random() * 100;
        let cumulative = 0;
        const normalizedVariants = totalWeight === 100
            ? testConfig.variants
            : testConfig.variants.map(v => ({ ...v, weight: (v.weight || 0) * 100 / totalWeight }));
        for (const variant of normalizedVariants) {
            cumulative += variant.weight || 0;
            if (rand <= cumulative) {
                setCookie(testConfig.cookieName, variant.id, testConfig.cookieExpiry);
                return variant.id;
            }
        }
        return normalizedVariants[0].id;
    }

    function getVariantLabel(testName, variantId) {
        const test = AB_TESTS[testName];
        if (!test) return null;
        const variant = test.variants.find(v => v.id === variantId);
        return variant ? variant.label : null;
    }

    function applyABTest(testName, selector, attribute = 'textContent') {
        const variantId = chooseVariant(AB_TESTS[testName]);
        const label = getVariantLabel(testName, variantId);
        if (!label) return;

        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (attribute === 'textContent') {
                el.textContent = label;
            } else if (attribute === 'value') {
                el.value = label;
            } else {
                el.setAttribute(attribute, label);
            }
            el.dataset.abTest = testName;
            el.dataset.abVariant = variantId;
        });

        if (window.NodeforgeAnalytics) {
            window.NodeforgeAnalytics.trackEvent('ab_test_assigned', {
                test_name: testName,
                variant_id: variantId,
                variant_label: label
            });
        }

        return { testName, variantId, label };
    }

    function trackABTestConversion(testName, variantId, conversionType = 'click') {
        if (window.NodeforgeAnalytics) {
            window.NodeforgeAnalytics.trackEvent('ab_test_conversion', {
                test_name: testName,
                variant_id: variantId,
                conversion_type: conversionType
            });
        }
    }

    function initABTests() {
        applyABTest('hero_cta_primary', '.hero-ctas .btn-primary');
        applyABTest('hero_cta_secondary', '.hero-ctas .btn-ghost');
        applyABTest('contact_cta', '.contact-buttons .btn-primary');
        applyABTest('contact_cta', '#mobile-cta .btn-primary');

        clickHandler = (e) => {
            const cta = e.target.closest('[data-ab-test]');
            if (cta) {
                trackABTestConversion(cta.dataset.abTest, cta.dataset.abVariant, 'click');
            }
        };
        document.addEventListener('click', clickHandler);
    }

    function destroy() {
        if (clickHandler) {
            document.removeEventListener('click', clickHandler);
            clickHandler = null;
        }
        if (pagehideHandler) {
            window.removeEventListener('pagehide', pagehideHandler);
            pagehideHandler = null;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initABTests, { once: true });
    } else {
        initABTests();
    }

    // Cleanup on page unload
    pagehideHandler = destroy;
    window.addEventListener('pagehide', pagehideHandler, { once: true });

    window.NodeforgeABTesting = {
        AB_TESTS,
        chooseVariant,
        getVariantLabel,
        applyABTest,
        trackABTestConversion,
        destroy
    };
})();