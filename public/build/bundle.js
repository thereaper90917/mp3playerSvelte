
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Components\Player.svelte generated by Svelte v3.37.0 */

    const file = "src\\Components\\Player.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (103:8) {#if songSrc !== []}
    function create_if_block(ctx) {
    	let each_1_anchor;
    	let each_value = /*songSrc*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*songSrc, clickedSrc*/ 6) {
    				each_value = /*songSrc*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(103:8) {#if songSrc !== []}",
    		ctx
    	});

    	return block;
    }

    // (104:10) {#each songSrc as source}
    function create_each_block(ctx) {
    	let tr;
    	let td;
    	let a;
    	let t0_value = /*source*/ ctx[12] + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", a_href_value = /*source*/ ctx[12]);
    			attr_dev(a, "title", "");
    			add_location(a, file, 106, 22, 2646);
    			add_location(td, file, 106, 18, 2642);
    			add_location(tr, file, 104, 14, 2573);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, a);
    			append_dev(a, t0);
    			append_dev(td, t1);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*clickedSrc*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*songSrc*/ 2 && t0_value !== (t0_value = /*source*/ ctx[12] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*songSrc*/ 2 && a_href_value !== (a_href_value = /*source*/ ctx[12])) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(104:10) {#each songSrc as source}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let section;
    	let div0;
    	let table;
    	let thead;
    	let tr;
    	let th;
    	let t1;
    	let tbody;
    	let t2;
    	let div3;
    	let div2;
    	let button0;
    	let i0;
    	let t3;
    	let button1;
    	let i1;
    	let t4;
    	let div1;
    	let span0;
    	let t5;
    	let span1;
    	let t6;
    	let progress;
    	let t7;
    	let i2;
    	let label;
    	let t8;
    	let t9;
    	let input;
    	let mounted;
    	let dispose;
    	let if_block = /*songSrc*/ ctx[1] !== [] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th = element("th");
    			th.textContent = "Song";
    			t1 = space();
    			tbody = element("tbody");
    			if (if_block) if_block.c();
    			t2 = space();
    			div3 = element("div");
    			div2 = element("div");
    			button0 = element("button");
    			i0 = element("i");
    			t3 = space();
    			button1 = element("button");
    			i1 = element("i");
    			t4 = space();
    			div1 = element("div");
    			span0 = element("span");
    			t5 = space();
    			span1 = element("span");
    			t6 = space();
    			progress = element("progress");
    			t7 = space();
    			i2 = element("i");
    			label = element("label");
    			t8 = text(/*current*/ ctx[0]);
    			t9 = space();
    			input = element("input");
    			attr_dev(th, "class", "sticky has-text-white");
    			add_location(th, file, 98, 10, 2401);
    			add_location(tr, file, 96, 8, 2334);
    			add_location(thead, file, 95, 6, 2317);
    			add_location(tbody, file, 101, 6, 2483);
    			attr_dev(table, "class", "table is-fullwidth is-align-content-center is-justify-content-center border");
    			set_style(table, "height", "300px");
    			set_style(table, "width", "100%");
    			add_location(table, file, 94, 4, 2185);
    			set_style(div0, "max-height", "200px");
    			set_style(div0, "max-width", "100% ");
    			set_style(div0, "overflow-y", "scroll");
    			add_location(div0, file, 93, 2, 2111);
    			attr_dev(i0, "class", "fas fa-play fa-2x");
    			add_location(i0, file, 117, 55, 3006);
    			attr_dev(button0, "class", "button");
    			add_location(button0, file, 117, 8, 2959);
    			attr_dev(i1, "class", "fas fa-stop fa-2x");
    			add_location(i1, file, 118, 49, 3099);
    			attr_dev(button1, "class", "button");
    			add_location(button1, file, 118, 8, 3058);
    			attr_dev(span0, "class", "has-text-white mr-1");
    			attr_dev(span0, "id", "test");
    			add_location(span0, file, 120, 10, 3198);
    			attr_dev(span1, "class", "has-text-white");
    			attr_dev(span1, "id", "duration");
    			add_location(span1, file, 121, 10, 3261);
    			set_style(div1, "height", "20%");
    			set_style(div1, "width", "30%");
    			add_location(div1, file, 119, 8, 3151);
    			attr_dev(progress, "id", "progress");
    			attr_dev(progress, "class", "progress is-danger");
    			progress.value = "";
    			attr_dev(progress, "max", "100");
    			add_location(progress, file, 124, 8, 3346);
    			attr_dev(label, "for", "text");
    			attr_dev(label, "class", "has-text-white ml-2");
    			add_location(label, file, 126, 47, 3486);
    			attr_dev(i2, "class", "ml-2 fas fa-volume-up fa-2x");
    			add_location(i2, file, 126, 8, 3447);
    			attr_dev(input, "id", "volume");
    			attr_dev(input, "class", "slider is-fullwidth is-medium is-danger is-circle");
    			attr_dev(input, "step", "0.1");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "1");
    			input.value = "10";
    			attr_dev(input, "type", "range");
    			attr_dev(input, "precision", "2");
    			add_location(input, file, 129, 8, 3584);
    			attr_dev(div2, "class", " border buttons is-align-content-center mt-2  ");
    			set_style(div2, "height", "100%");
    			set_style(div2, "width", "100%");
    			attr_dev(div2, "id", "player");
    			add_location(div2, file, 116, 6, 2844);
    			add_location(div3, file, 114, 4, 2823);
    			attr_dev(section, "class", "section is-flex-direction-column ");
    			set_style(section, "height", "100%");
    			set_style(section, "width", "100%");
    			add_location(section, file, 92, 0, 2021);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th);
    			append_dev(table, t1);
    			append_dev(table, tbody);
    			if (if_block) if_block.m(tbody, null);
    			append_dev(section, t2);
    			append_dev(section, div3);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(button0, i0);
    			append_dev(div2, t3);
    			append_dev(div2, button1);
    			append_dev(button1, i1);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t5);
    			append_dev(div1, span1);
    			append_dev(div2, t6);
    			append_dev(div2, progress);
    			append_dev(div2, t7);
    			append_dev(div2, i2);
    			append_dev(i2, label);
    			append_dev(label, t8);
    			append_dev(div2, t9);
    			append_dev(div2, input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*openDialog*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*test*/ ctx[3], false, false, false),
    					listen_dev(input, "change", /*change_handler*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*songSrc*/ ctx[1] !== []) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(tbody, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*current*/ 1) set_data_dev(t8, /*current*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function formatTime(secs) {
    	var minutes = Math.floor(secs / 60) || 0;
    	var seconds = secs - minutes * 60 || 0;
    	return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Player", slots, []);
    	const { ipcRenderer } = require("electron");
    	const { Howl, Howler } = require("howler");

    	// From Electron
    	let current = 0;

    	let src;
    	let songSrc = [];

    	function clickedSrc(e) {
    		e.preventDefault();
    		let volume = document.getElementById("volume");
    		let getHref = e.currentTarget.getAttribute("href");
    		let progress = document.getElementById("progress");
    		let duration = document.getElementById("duration");
    		let running = document.getElementById("test");

    		volume.addEventListener("change", e => {
    			let floatVolume = parseFloat(e.target.value);
    			Howler.volume(floatVolume);
    		});

    		function step() {
    			let seek = sound.seek() || 0;
    			let time = seek / sound.duration() * 100 || 0;
    			progress.value = time.toFixed(0);
    			running.innerHTML = `${time.toFixed(2)}  /`;

    			if (sound.playing()) {
    				requestAnimationFrame(step);
    			}
    		}

    		let sound = new Howl({
    				src: [getHref],
    				onplay() {
    					requestAnimationFrame(step);
    					duration.innerHTML = `${formatTime(Math.round(sound.duration()))}`;
    				}
    			});

    		sound.play();
    		setSrc(getHref);
    	}

    	function setSrc(msg) {
    		src = msg;
    	}

    	function test() {
    		let sound = new Howl({ src: [src], volume: 1.5 });
    		sound.play();
    	}

    	// Dialog
    	ipcRenderer.on("srcPath", (e, data) => {
    		srcPaths(data);
    	});

    	function srcPaths(path) {
    		$$invalidate(1, songSrc = path);
    	}

    	// Svelte
    	function openDialog() {
    		ipcRenderer.send("opendialog");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Player> was created with unknown prop '${key}'`);
    	});

    	const change_handler = e => $$invalidate(0, current = parseFloat(e.target.value) * 100);

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		Howl,
    		Howler,
    		current,
    		src,
    		songSrc,
    		formatTime,
    		clickedSrc,
    		setSrc,
    		test,
    		srcPaths,
    		openDialog
    	});

    	$$self.$inject_state = $$props => {
    		if ("current" in $$props) $$invalidate(0, current = $$props.current);
    		if ("src" in $$props) src = $$props.src;
    		if ("songSrc" in $$props) $$invalidate(1, songSrc = $$props.songSrc);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [current, songSrc, clickedSrc, test, openDialog, change_handler];
    }

    class Player extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Player",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.37.0 */

    function create_fragment(ctx) {
    	let player;
    	let current;
    	player = new Player({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(player.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(player, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(player.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(player.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(player, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Player });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
