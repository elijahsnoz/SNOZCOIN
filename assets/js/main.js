document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav')
  const navToggle = document.getElementById('navToggle')

  // mobile nav toggle
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open')
      navToggle.setAttribute('aria-expanded', String(isOpen))
    })
  }

  // smooth scroll for in-page anchors + close mobile nav on click
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href')
      if (href.length > 1) {
        const el = document.querySelector(href)
        if (el) {
          e.preventDefault()
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
      if (nav && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open')
        navToggle?.setAttribute('aria-expanded', 'false')
      }
    })
  })

  // scroll reveal
  const revealEls = document.querySelectorAll('.reveal')
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' })
    revealEls.forEach(el => io.observe(el))
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'))
  }

  // gallery lightbox
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'))
  const lightbox = document.getElementById('lightbox')
  const lbImage = lightbox && lightbox.querySelector('.lb-image')
  const lbCaption = lightbox && lightbox.querySelector('.lb-caption')
  const lbMeta = lightbox && lightbox.querySelector('.lb-meta')
  let currentIndex = 0

  function openLightbox(i) {
    const item = galleryItems[i]
    const img = item && item.querySelector('img')
    if (!img || !lbImage) return
    currentIndex = i
    lbImage.src = img.src
    lbImage.alt = img.alt || ''
    const figTitle = item.querySelector('figcaption span:not(.credit)')?.textContent || ''
    const figCredit = item.querySelector('figcaption .credit')?.textContent || ''
    lbCaption.textContent = figCredit ? `${figTitle} — ${figCredit}` : figTitle

    // real, catalogued pieces carry year/medium/size/story data attributes;
    // sketch-style studies don't, so lb-meta just stays empty for those.
    const { year, medium, size, story } = item.dataset
    if (story) {
      const details = [year, medium, size].filter(Boolean).join(' · ')
      lbMeta.innerHTML = `${details ? `<p class="lb-details">${details}</p>` : ''}<p class="lb-story">${story}</p>`
    } else {
      lbMeta.innerHTML = ''
    }

    lightbox.setAttribute('aria-hidden', 'false')
  }

  function closeLightbox() {
    lightbox.setAttribute('aria-hidden', 'true')
    lbImage.src = ''
  }

  galleryItems.forEach((g, i) => {
    g.addEventListener('click', () => openLightbox(i))
  })

  if (lightbox) {
    lightbox.querySelector('.lb-close')?.addEventListener('click', closeLightbox)
    lightbox.querySelector('.lb-prev')?.addEventListener('click', () => {
      openLightbox((currentIndex - 1 + galleryItems.length) % galleryItems.length)
    })
    lightbox.querySelector('.lb-next')?.addEventListener('click', () => {
      openLightbox((currentIndex + 1) % galleryItems.length)
    })
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox() })
    document.addEventListener('keydown', (e) => {
      if (lightbox.getAttribute('aria-hidden') === 'false') {
        if (e.key === 'Escape') closeLightbox()
        if (e.key === 'ArrowLeft') lightbox.querySelector('.lb-prev')?.click()
        if (e.key === 'ArrowRight') lightbox.querySelector('.lb-next')?.click()
      }
    })
  }

  // copy mint address
  const copyBtn = document.getElementById('copyMint')
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const mint = copyBtn.getAttribute('data-mint') || ''
      try {
        await navigator.clipboard.writeText(mint)
      } catch {
        const ta = document.createElement('textarea')
        ta.value = mint
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        ta.remove()
      }
      const original = copyBtn.textContent
      copyBtn.textContent = 'Copied!'
      copyBtn.setAttribute('data-copied', 'true')
      setTimeout(() => {
        copyBtn.textContent = original
        copyBtn.removeAttribute('data-copied')
      }, 1800)
    })
  }

  // copy meme captions for easy sharing
  document.querySelectorAll('.meme-card .share').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const caption = btn.getAttribute('data-caption') || ''
      try {
        await navigator.clipboard.writeText(caption)
        btn.textContent = '✓'
        setTimeout(() => { btn.textContent = '⇪' }, 1500)
      } catch { /* clipboard unavailable */ }
    })
  })

  // footer year
  const yearEl = document.getElementById('year')
  if (yearEl) yearEl.textContent = new Date().getFullYear()

  // SNOZ should feel alive: a subtle cursor-reactive lean on the hero character.
  // CSS transition on .frame handles the easing, so this just sets a target transform.
  const heroSection = document.querySelector('.hero')
  const heroFrame = document.querySelector('.hero-art .frame')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (heroSection && heroFrame && !reducedMotion) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect()
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
      const x = Math.max(-1, Math.min(1, dx))
      const y = Math.max(-1, Math.min(1, dy))
      heroFrame.style.transform = `translate(${x * 10}px, ${y * 8}px) rotate(${x * 3}deg)`
    })
    heroSection.addEventListener('mouseleave', () => {
      heroFrame.style.transform = ''
    })
  }
})
