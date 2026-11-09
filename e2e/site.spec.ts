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
  for (const url of ['./', `./#/project/${generated.projects[0].slug}`]) {
    await page.goto(url)
    await page.waitForTimeout(300)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, url).toBe(0)
  }
})

test('карточка ведёт на страницу проекта, «Все проекты» — обратно', async ({ page }) => {
  const first = generated.projects[0]
  await page.goto('./#projects')
  await page.getByRole('heading', { level: 3, name: first.title }).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`#/project/${first.slug}$`))
  await expect(page.getByRole('heading', { level: 1, name: first.title })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'История версий' })).toBeVisible()
  await page.getByRole('link', { name: 'Все проекты' }).click()
  await expect(page.getByRole('heading', { level: 3, name: first.title })).toBeInViewport()
})

test('кнопка скачивания ведёт на установщик из последнего релиза', async ({ page }) => {
  const withRelease = generated.projects.find((p) => p.releases?.some((r) => r.installer))
  test.skip(!withRelease, 'нет релизов с установщиком')
  await page.goto(`./#/project/${withRelease!.slug}`)
  const link = page.getByRole('link', { name: /Скачать для Windows/ })
  await expect(link).toHaveAttribute('href', /\.exe$/)
})

test('несуществующий проект — понятное сообщение', async ({ page }) => {
  await page.goto('./#/project/no-such-project')
  await expect(page.getByRole('heading', { level: 1, name: 'Такого проекта нет' })).toBeVisible()
})

test('«Играть тут» открывает приложение поверх страницы', async ({ page }) => {
  const game = generated.projects.find((p) => /головолом|аркад/i.test(p.title))!
  await page.goto(`./#/project/${game.slug}`)
  await page.getByRole('button', { name: 'Играть тут' }).first().click()
  const dialog = page.getByRole('dialog', { name: game.title })
  await expect(dialog).toBeVisible()
  // Встроенная сборка есть после npm run apps; без неё — подсказка вместо пустого окна
  await expect(dialog.locator('iframe').or(dialog.getByText('npm run apps'))).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('командная палитра: поиск и переход к проекту', async ({ page }) => {
  const project = generated.projects[1]
  await page.goto('./')
  await page.getByRole('button', { name: 'Поиск и команды' }).click()
  const input = page.getByRole('combobox')
  await expect(input).toBeFocused()
  await input.fill(project.title.slice(0, 5))
  await expect(page.getByRole('option', { name: project.title, exact: true })).toBeVisible()
  await page.getByRole('option', { name: project.title, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`#/project/${project.slug}$`))
})

test('язык и тема переключаются и запоминаются', async ({ page, isMobile }) => {
  await page.goto('./')
  if (isMobile) await page.getByRole('button', { name: 'Открыть меню' }).click()
  await page.getByRole('button', { name: 'Language: English' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(/Hi, I'm/)
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('страница для шаринга отдаёт превью и ведёт на проект', async ({ page, request }) => {
  const project = generated.projects[0]
  const html = await (await request.get(`./p/${project.slug}/`)).text()
  expect(html).toContain(`og/${project.slug}.jpg`)
  await page.goto(`./p/${project.slug}/`)
  await expect(page).toHaveURL(new RegExp(`#/project/${project.slug}$`))
})

test('форма «Написать мне»: проверка полей и отправка', async ({ page }) => {
  const sent: unknown[] = []
  await page.route('https://formsubmit.test/ajax/test', async (route) => {
    sent.push(route.request().postDataJSON())
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"success":"true"}' })
  })
  await page.goto('./#contact')
  const form = page.locator('#contact form')
  await form.getByRole('button', { name: 'Отправить', exact: true }).click()
  await expect(form.getByText('Заполни это поле').first()).toBeVisible()
  expect(sent).toHaveLength(0)

  await form.getByLabel('Как тебя зовут').fill('Анна')
  await form.getByLabel('Почта или @telegram').fill('anna@example.com')
  await form.getByLabel('Сообщение').fill('Привет! Хочу заказать сайт.')
  await form.getByRole('button', { name: 'Отправить', exact: true }).click()
  await expect(page.getByText('Сообщение улетело!')).toBeVisible()
  expect(sent[0]).toMatchObject({ name: 'Анна', contact: 'anna@example.com', _replyto: 'anna@example.com', _honey: '' })
})

test('терминал: ` открывает, команды работают', async ({ page, isMobile }) => {
  test.skip(isMobile, 'на телефоне нет клавиатуры — терминал открывается из палитры')
  await page.goto('./')
  await page.keyboard.press('Backquote')
  const term = page.getByRole('dialog', { name: 'Терминал' })
  await expect(term).toBeVisible()
  const input = term.getByRole('textbox', { name: 'Команда' })
  await input.fill('projects')
  await input.press('Enter')
  await expect(term.getByText(generated.projects[0].slug).first()).toBeVisible()
  await input.fill(`open ${generated.projects[0].slug}`)
  await input.press('Enter')
  await expect(page).toHaveURL(new RegExp(`#/project/${generated.projects[0].slug}$`))
  await expect(term).toBeHidden()
})

test('страница 404 с игрой', async ({ page }) => {
  await page.goto('./404.html')
  await expect(page.getByRole('heading', { level: 1, name: 'Страница потерялась' })).toBeVisible()
  await expect(page.getByRole('application', { name: 'Игра «Разбей 404»' })).toBeVisible()
  await page.goto('./#/no-such-page')
  await expect(page.getByRole('heading', { level: 1, name: 'Страница потерялась' })).toBeVisible()
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
