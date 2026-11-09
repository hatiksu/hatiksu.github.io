import { expect, test } from '@playwright/test'
import generated from '../src/data/projects.generated.json' with { type: 'json' }

test('первый экран: имя и кнопки', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(/Привет, я/)
  await expect(page.getByRole('link', { name: 'Смотреть проекты →' })).toBeVisible()
})

test('проекты подтягиваются из portfolio.json', async ({ page }) => {
  await page.goto('./#projects')
  const titles = generated.projects.map((p) => p.title)
  expect(titles.length).toBeGreaterThan(0)
  for (const title of titles) {
    await expect(page.getByRole('heading', { level: 3, name: title })).toBeAttached()
  }
  // Счётчик проектов совпадает со списком (анимация запускается, когда счётчик на экране)
  await page.locator('#stats').scrollIntoViewIfNeeded()
  await expect(page.locator('#stats').getByText('проектов в портфолио').locator('..').locator('strong [aria-hidden]')).toHaveText(
    String(titles.length),
  )
})

test('нет горизонтальной прокрутки', async ({ page }) => {
  await page.goto('./')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBe(0)
})

test.describe('мобильное меню', () => {
  test.skip(({ isMobile }) => !isMobile, 'бургер есть только на телефоне')

  test('бургер открывает меню, ссылка ведёт к разделу и закрывает его', async ({ page }) => {
    await page.goto('./')
    const burger = page.getByRole('button', { name: 'Открыть меню' })
    await burger.click()
    const menu = page.getByRole('dialog', { name: 'Меню' })
    await expect(menu).toBeVisible()
    await expect(page.getByRole('button', { name: 'Закрыть меню' })).toHaveAttribute('aria-expanded', 'true')

    await menu.getByRole('link', { name: /Проекты/ }).click()
    await expect(menu).toBeHidden()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300)
  })

  test('Esc закрывает меню', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: 'Открыть меню' }).click()
    await expect(page.getByRole('dialog', { name: 'Меню' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Меню' })).toBeHidden()
  })
})

test.describe('навигация на компьютере', () => {
  test.skip(({ isMobile }) => isMobile, 'на телефоне вместо ссылок бургер')

  test('активный раздел подсвечивается', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Проекты' }).click()
    await expect(page.getByRole('navigation', { name: 'Основная навигация' }).locator('[aria-current="true"]')).toHaveText('Проекты')
  })
})
