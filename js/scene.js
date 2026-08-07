/* ============================================================
   NODEFORGE — Hero 3D: exploded modular structure (photo-match)
   Orthographic isometric camera — flat CAD-like look, matches ref photo.
   Matte anodized metal + smoky glass with cyan-blue glow edges.
   Palette: #D5DCE5 #9CA7B7 #556070 #242C36 + glow #6FD8FF
   ============================================================ */
(function () {
    'use strict';

    var container = document.getElementById('three-container');
    if (!container || typeof THREE === 'undefined') return;

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06070a, 0.008);

    /* ---- Orthographic isometric camera — matches the flat,
           parallel-edge look of the reference photo ---- */
    var frustum = 6.3;
    var aspect0 = container.clientWidth / Math.max(container.clientHeight, 1);
    var camera = new THREE.OrthographicCamera(
        -frustum * aspect0, frustum * aspect0,
        frustum, -frustum,
        0.1, 100
    );
    var ISO = Math.PI / 3.1; // ~58° — steeper top-down angle, matches reference photo
    var camDist = 14;
    camera.position.set(
        camDist * Math.cos(ISO) * Math.sin(Math.PI / 4),
        camDist * Math.sin(ISO),
        camDist * Math.cos(ISO) * Math.cos(Math.PI / 4)
    );
    camera.lookAt(0, 0.2, 0);

    // Low-power devices (small viewport = likely phone, or explicit reduced-motion
    // preference) get a lighter render path: no shadows, no AA, capped pixel ratio.
    // The model is a 45-55% opacity decorative background on mobile — full desktop
    // quality there just burns battery and can drop frames on mid/low-end GPUs.
    var isLowPower = window.innerWidth < 900 ||
        (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isLowPower });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowPower ? 1.5 : 2));
    renderer.shadowMap.enabled = !isLowPower;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Resource tracking for proper disposal
    var trackedGeometries = [];
    var trackedMaterials = [];
    var trackedTextures = [];
    var trackedRenderTargets = [];

    function trackGeo(geo) { trackedGeometries.push(geo); return geo; }
    function trackMat(mat) { trackedMaterials.push(mat); return mat; }
    function trackTex(tex) { trackedTextures.push(tex); return tex; }
    function trackRT(rt) { trackedRenderTargets.push(rt); return rt; }

    /* ---- Neutral studio environment (canvas gradient → PMREM) ---- */
    function buildEnvironment() {
        var c = document.createElement('canvas');
        c.width = 256;
        c.height = 128;
        var ctx = c.getContext('2d');
        var grad = ctx.createLinearGradient(0, 0, 0, c.height);
        grad.addColorStop(0.0, '#3a424e');
        grad.addColorStop(0.45, '#14181f');
        grad.addColorStop(1.0, '#05060a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, c.width, c.height);
        var win = ctx.createRadialGradient(c.width * 0.8, c.height * 0.38, 4, c.width * 0.8, c.height * 0.38, 60);
        win.addColorStop(0, 'rgba(210,220,235,0.9)');
        win.addColorStop(1, 'rgba(210,220,235,0)');
        ctx.fillStyle = win;
        ctx.fillRect(0, 0, c.width, c.height);

        var tex = trackTex(new THREE.CanvasTexture(c));
        tex.mapping = THREE.EquirectangularReflectionMapping;
        var pmrem = trackMat(new THREE.PMREMGenerator(renderer));
        var envRT = trackRT(pmrem.fromEquirectangular(tex));
        pmrem.dispose();
        return trackTex(envRT.texture);
    }
    var envMap = buildEnvironment();

    /* ---- Lighting: cold key 6500-7000K above / strong blue rim / weak cold fill ---- */
    var keyLight = new THREE.DirectionalLight(0xdbe8ff, 1.8);
    keyLight.position.set(1.5, 9, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.radius = 6;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    scene.add(keyLight);

    var rimLight = new THREE.DirectionalLight(0x6fd8ff, 1.7);
    rimLight.position.set(7, 2.2, -3.5);
    scene.add(rimLight);

    var fillLight = new THREE.DirectionalLight(0x93a4bd, 0.18);
    fillLight.position.set(-6, -1.5, 4);
    scene.add(fillLight);

    scene.add(new THREE.AmbientLight(0x2a3340, 0.5));

    var glowA = new THREE.PointLight(0x6fd8ff, 1.5, 8, 2);
    glowA.position.set(1.2, 1.6, 2.0);
    scene.add(glowA);
    var glowB = new THREE.PointLight(0x4fc3ff, 1.0, 7, 2);
    glowB.position.set(-2.6, 0.6, 1.8);
    scene.add(glowB);
    var glowC = new THREE.PointLight(0x4fc3ff, 0.8, 6, 2);
    glowC.position.set(2.6, -0.8, 1.2);
    scene.add(glowC);

    /* ---- Materials ---- */
    function metal(hex, rough) {
        return trackMat(new THREE.MeshStandardMaterial({
            color: hex,
            metalness: 0.82,
            roughness: rough !== undefined ? rough : 0.55,
            envMap: envMap,
            envMapIntensity: 0.9
        }));
    }
    function chrome() {
        return trackMat(new THREE.MeshStandardMaterial({
            color: 0xe8edf4,
            metalness: 1.0,
            roughness: 0.17,
            envMap: envMap,
            envMapIntensity: 1.3
        }));
    }
    function screenPanel() {
        return trackMat(new THREE.MeshStandardMaterial({
            color: 0x050608,
            metalness: 0.1,
            roughness: 0.35,
            envMap: envMap,
            envMapIntensity: 0.15
        }));
    }
    function smokedGlass(glow) {
        return trackMat(new THREE.MeshPhysicalMaterial({
            color: 0x242c36,
            metalness: 0,
            roughness: 0.22,
            transparent: true,
            opacity: 0.4,
            ior: 1.49,
            envMap: envMap,
            envMapIntensity: 0.7,
            clearcoat: 0.7,
            clearcoatRoughness: 0.25,
            emissive: glow ? 0x2fa9ff : 0x0d3a52,
            emissiveIntensity: glow ? 0.65 : 0.18
        }));
    }

    var MAT = {
        light: metal(0xd5dce5, 0.5),
        mid: metal(0x9ca7b7, 0.55),
        dark: metal(0x556070, 0.6),
        deep: metal(0x242c36, 0.62),
        chrome: chrome(),
        screen: screenPanel(),
        glass: smokedGlass(false),
        glassGlow: smokedGlass(true)
    };

    var edgeMat = trackMat(new THREE.LineBasicMaterial({ color: 0x6fd8ff, transparent: true, opacity: 0.5 }));
    function addEdgeGlow(mesh, geo, opacity) {
        var edges = trackGeo(new THREE.EdgesGeometry(geo));
        var mat = opacity !== undefined
            ? trackMat(new THREE.LineBasicMaterial({ color: 0x6fd8ff, transparent: true, opacity: opacity }))
            : edgeMat;
        var line = new THREE.LineSegments(edges, mat);
        mesh.add(line);
    }

    function box(w, h, d, mat, x, y, z, glowEdges) {
        var geo = trackGeo(new THREE.BoxGeometry(w, h, d));
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x || 0, y || 0, z || 0);
        m.castShadow = true;
        m.receiveShadow = true;
        if (glowEdges) addEdgeGlow(m, geo, glowEdges === true ? 0.5 : glowEdges);
        return m;
    }
    // Chamfered box — hard 1-2mm-style corner cuts (per spec), used for the
    // main chassis layers where visible fasky/chamfers matter most.
    function chamferedBox(w, h, d, chamfer, mat, x, y, z, glowEdges) {
        var hw = w / 2, hd = d / 2;
        var c = Math.min(chamfer, hw * 0.6, hd * 0.6);
        var shape = new THREE.Shape();
        shape.moveTo(-hw + c, -hd);
        shape.lineTo(hw - c, -hd);
        shape.lineTo(hw, -hd + c);
        shape.lineTo(hw, hd - c);
        shape.lineTo(hw - c, hd);
        shape.lineTo(-hw + c, hd);
        shape.lineTo(-hw, hd - c);
        shape.lineTo(-hw, -hd + c);
        shape.closePath();
        var geo = trackGeo(new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false }));
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, -h / 2, 0);
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x || 0, y || 0, z || 0);
        m.castShadow = true;
        m.receiveShadow = true;
        if (glowEdges) addEdgeGlow(m, geo, glowEdges === true ? 0.5 : glowEdges);
        return m;
    }
    function ring(innerR, outerR, mat, x, y, z, rx, ry) {
        var shape = new THREE.Shape();
        shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
        var hole = new THREE.Path();
        hole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
        shape.holes.push(hole);
        var geo = trackGeo(new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false }));
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x || 0, y || 0, z || 0);
        m.rotation.set(rx || 0, ry || 0, 0);
        m.castShadow = true;
        return m;
    }
    // Connector — small threaded cylinder linking two modules (per spec)
    function connector(x, y, z, rx, rz) {
        var g = new THREE.Group();
        var bodyGeo = trackGeo(new THREE.CylinderGeometry(0.045, 0.045, 0.4, 10));
        var body = new THREE.Mesh(bodyGeo, MAT.chrome);
        body.castShadow = true;
        g.add(body);
        var capTopGeo = trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.03, 10));
        var capTop = new THREE.Mesh(capTopGeo, MAT.deep);
        capTop.position.y = 0.2;
        g.add(capTop);
        var capBotGeo = trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.03, 10));
        var capBot = new THREE.Mesh(capBotGeo, MAT.deep);
        capBot.position.y = -0.2;
        g.add(capBot);
        g.position.set(x, y, z);
        g.rotation.set(rx || 0, 0, rz || 0);
        return g;
    }

    /* ---- Composition mapped from reference photo:
           central cube w/ ring detail + stacked plates above,
           exploded modules placed to match photo quadrants ---- */
    var group = new THREE.Group();
    scene.add(group);

    var core = new THREE.Group();

    // Central chassis — 4 offset square layers, decreasing toward center (per spec)
    var layerSpecs = [
        { s: 2.2, h: 0.32, ox: 0, oz: 0, mat: MAT.dark },
        { s: 1.75, h: 0.28, ox: 0.09, oz: -0.07, mat: MAT.mid },
        { s: 1.32, h: 0.26, ox: -0.08, oz: 0.09, mat: MAT.light },
        { s: 0.9, h: 0.24, ox: 0.06, oz: 0.06, mat: MAT.deep }
    ];
    var layerY = -0.62;
    for (var li = 0; li < layerSpecs.length; li++) {
        var ls = layerSpecs[li];
        var plate = chamferedBox(ls.s, ls.h, ls.s, 0.05, ls.mat, ls.ox, layerY + ls.h / 2, ls.oz, 0.28);
        core.add(plate);
        layerY += ls.h + 0.05; // 5cm tech gap between layers
    }

    // Thin chrome edge strip at the seam between the two largest layers
    var seam = box(2.24, 0.03, 2.24, MAT.chrome, 0, -0.62 + layerSpecs[0].h + 0.025, 0);
    core.add(seam);

    // Recessed matte-black screen panels on two adjacent front faces (per spec)
    var screenL = box(0.95, 0.24, 0.02, MAT.screen, -0.5, -0.46, 1.115);
    core.add(screenL);
    var screenR = box(0.95, 0.24, 0.02, MAT.screen, 0.5, -0.46, 1.115);
    core.add(screenR);
    var screenSide = box(0.02, 0.24, 0.95, MAT.screen, 1.115, -0.46, -0.5);
    core.add(screenSide);

    // Smoky glass collar between chassis and stack
    core.add(box(2.0, 0.3, 2.0, MAT.glass, 0, 0.83, 0, 0.5));

    // Circular lens/port detail on the largest layer's front face
    core.add(ring(0.32, 0.5, MAT.deep, 0, -0.46, 1.11, 0, 0));
    core.add(ring(0.15, 0.28, MAT.glassGlow, 0, -0.46, 1.13, 0, 0));

    // Stacked plate system directly above the core (heatsink stack)
    var plateY = 1.03;
    var plateSpecs = [
        [2.05, 0.09, 2.05, MAT.mid],
        [1.82, 0.08, 1.82, MAT.light],
        [1.55, 0.08, 1.55, MAT.mid],
        [1.26, 0.09, 1.26, MAT.light],
        [0.92, 0.12, 0.92, MAT.dark]
    ];
    for (var i = 0; i < plateSpecs.length; i++) {
        var s = plateSpecs[i];
        core.add(box(s[0], s[1], s[2], s[3], 0, plateY, 0));
        plateY += s[1] + 0.075;
    }
    core.add(box(0.5, 0.1, 0.5, MAT.light, 0, plateY + 0.02, 0));
    core.add(box(2.5, 0.12, 2.5, MAT.deep, 0, -1.0, 0));
    group.add(core);

    // Connectors linking chassis layers to nearby floating modules (per spec: 3-4)
    core.add(connector(1.3, -0.3, 0.9, 0, Math.PI / 5));
    core.add(connector(-1.25, 0.05, 0.75, 0, -Math.PI / 6));
    core.add(connector(0.85, 1.4, -0.6, Math.PI / 2.4, 0));
    core.add(connector(-0.7, 0.55, -1.05, Math.PI / 2.7, 0.4));

    var modules = [];
    function addModule(mesh) {
        var x = mesh.position.x, z = mesh.position.z;
        mesh.userData = {
            y: mesh.position.y,
            radius: Math.sqrt(x * x + z * z),
            angle0: Math.atan2(z, x)
        };
        modules.push(mesh);
        group.add(mesh);
    }

    // Top-left — big tilted flat plate (matches photo's large top plate)
    var topPlate = box(1.7, 0.14, 1.7, MAT.light, -1.55, 2.55, -0.4, 0.3);
    topPlate.rotation.y = 0.35;
    addModule(topPlate);

    // Top-right — small cube
    addModule(box(0.62, 0.62, 0.62, MAT.mid, 2.15, 2.7, -1.0, 0.25));

    // Left-mid — open drawer / tray module
    var drawerBody = box(0.95, 0.75, 0.75, MAT.deep, -3.15, 0.1, 0.55, 0.3);
    addModule(drawerBody);
    var drawerTray = box(0.55, 0.1, 0.9, MAT.mid, -3.15, -0.05, 1.15);
    addModule(drawerTray);

    // Right side — tall vertical glowing glass pane (closest to camera)
    addModule(box(0.42, 1.6, 0.16, MAT.glassGlow, 3.25, 0.5, 1.3, 0.55));
    // Right side, further back — second thinner vertical pane
    addModule(box(0.3, 1.1, 0.12, MAT.glass, 3.85, -0.2, 0.1, 0.4));

    // Bottom-left — two stacked square plates
    addModule(box(1.35, 0.1, 1.35, MAT.mid, -2.15, -1.55, 1.6, 0.2));
    addModule(box(1.05, 0.09, 1.05, MAT.light, -2.15, -1.32, 1.6));

    // Bottom-right — small glowing cube + thin deep plate
    addModule(box(0.4, 0.4, 0.4, MAT.glassGlow, 2.55, -1.5, 1.75, 0.5));
    addModule(box(1.0, 0.09, 0.7, MAT.deep, 3.05, -1.85, 0.4));

    // Back-scatter — small fillers for depth
    addModule(box(0.3, 0.3, 0.3, MAT.dark, -1.1, 1.55, -1.9));
    addModule(box(0.5, 0.12, 0.5, MAT.mid, 1.15, -0.5, -2.1));
    addModule(box(0.25, 0.25, 0.25, MAT.glassGlow, -0.3, -1.9, -1.1));

    // Ground shadow catcher
    var shadowPlaneGeo = trackGeo(new THREE.PlaneGeometry(24, 24));
    var shadowPlaneMat = trackMat(new THREE.ShadowMaterial({ opacity: 0.28 }));
    var shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.07;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    var zoom = 0.85;
    /* ---- Responsive framing ---- */
    function frame() {
        var aspect = container.clientWidth / Math.max(container.clientHeight, 1);
        var f = frustum * zoom;
        camera.left = -f * aspect;
        camera.right = f * aspect;
        camera.top = f;
        camera.bottom = -f;
        camera.updateProjectionMatrix();

        if (aspect < 0.95) {
            group.scale.setScalar(0.85);
            group.position.set(0, -0.2, 0);
        } else if (aspect < 1.25) {
            group.scale.setScalar(0.95);
            group.position.set(0.2, -0.1, 0);
        } else {
            group.scale.setScalar(1.0);
            group.position.set(0.2, 0, 0);
        }
    }
    frame();

    /* ---- Static base pose (set from HUD readout: Y 9.5°, X -49.4°, zoom 0.85x) ---- */
    var baseRY = 9.5 * Math.PI / 180, baseRX = -49.4 * Math.PI / 180;
    group.rotation.y = baseRY;
    group.rotation.x = baseRX;

    /* ---- HUD: live readout of rotation (deg) + zoom — only shown when the
           container has data-hud="true" (standalone model-viewer page) ---- */
    var hud = null;
    if (container.dataset && container.dataset.hud === 'true') {
        hud = document.createElement('div');
        hud.style.cssText = 'position:absolute;left:14px;bottom:14px;' +
            'font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;' +
            'color:#BFE6FF;background:rgba(6,7,10,0.72);border:1px solid rgba(111,216,255,0.35);' +
            'border-radius:8px;padding:10px 14px;pointer-events:none;white-space:pre;z-index:5;';
        container.appendChild(hud);
        hud.textContent =
            'Поворот Y: ' + (((baseRY * 180 / Math.PI) % 360 + 360) % 360).toFixed(1) + '°\n' +
            'Наклон X: ' + (baseRX * 180 / Math.PI).toFixed(1) + '°\n' +
            'Масштаб (zoom): ' + zoom.toFixed(2) + 'x';
    }

    /* ---- Static display: no drag, no zoom — only the peripheral modules
           slowly orbit around the still, fixed center core ---- */
    var clock = new THREE.Clock();
    var ORBIT_SPEED = 0.09; // rad/sec — slow, smooth rotation around the center
    var isPaused = false;
    // Respect prefers-reduced-motion: render one static frame, skip the
    // continuous orbit/requestAnimationFrame loop entirely.
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function animate() {
        requestAnimationFrame(animate);
        if (isPaused) return;
        var delta = clock.getDelta();
        var t = clock.getElapsedTime();

        // Core stays perfectly still — group rotation is fixed, never touched here

        for (var i = 0; i < modules.length; i++) {
            var m = modules[i];
            var ang = m.userData.angle0 + t * ORBIT_SPEED;
            m.position.x = Math.cos(ang) * m.userData.radius;
            m.position.z = Math.sin(ang) * m.userData.radius;
            m.position.y = m.userData.y;
            m.rotation.y += ORBIT_SPEED * delta;
        }

        renderer.render(scene, camera);
    }

    if (reduceMotion) {
        renderer.render(scene, camera);
    } else {
        animate();
    }

    function dispose() {
        // Stop animation
        isPaused = true;

        // Remove event listeners
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onVisibilityChange);

        // Dispose geometries
        trackedGeometries.forEach(function (geo) { geo.dispose(); });

        // Dispose materials
        trackedMaterials.forEach(function (mat) { mat.dispose(); });

        // Dispose textures
        trackedTextures.forEach(function (tex) { tex.dispose(); });

        // Dispose renderer
        renderer.dispose();
        renderer.forceContextLoss();

        // Remove canvas from container
        if (renderer.domElement && renderer.domElement.parentNode === container) {
            container.removeChild(renderer.domElement);
        }

        // Clear resources
        trackedGeometries.length = 0;
        trackedMaterials.length = 0;
        trackedTextures.length = 0;
    }

    // Wrap event handlers for removal
    function onResize() {
        if (resizeTimeout) return;
        resizeTimeout = setTimeout(function () {
            var w = container.clientWidth;
            var h = Math.max(container.clientHeight, 1);
            renderer.setSize(w, h);
            frame();
            resizeTimeout = null;
        }, 100);
    }

    function onVisibilityChange() {
        isPaused = document.hidden;
        if (!isPaused) clock.getDelta();
    }

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Cleanup on page unload
    window.addEventListener('pagehide', dispose, { once: true });

    // Expose dispose for manual cleanup
    window.NodeforgeScene = { dispose: dispose };
})();
