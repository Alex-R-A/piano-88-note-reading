import { test, expect, type Page } from '@playwright/test';

/**
 * Click the keyboard center until the answer registers (the overlay's
 * data-feedback attribute leaves 'none'), then let the feedback cycle
 * finish. The R3F canvas initializes asynchronously, so a click issued the
 * moment the lesson screen appears can land before the 3D scene is
 * interactive. Returns the feedback verdict. Consumes one answer.
 */
async function answerAtCenter(page: Page): Promise<string> {
  const overlay = page.getByTestId('feedback-overlay');
  const canvas = page.locator('canvas');
  const box = (await canvas.boundingBox())!;
  let verdict = 'none';
  await expect(async () => {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(120);
    verdict = (await overlay.getAttribute('data-feedback')) ?? 'none';
    expect(verdict).not.toBe('none');
  }).toPass({ timeout: 15000 });
  // Let feedback + advance + the next note's fade-in complete so the next
  // click lands on a fresh, unlocked question.
  await page.waitForTimeout(1400);
  return verdict;
}

/**
 * Full lesson flow against the real UI.
 *
 * Audio samples are network-fetched by smplr; per the spec's testing
 * strategy, audio is stubbed: the sample CDN is blocked, so audio
 * initialization fails fast and deterministically, and the lesson screen
 * shows its "Audio unavailable" notice (itself part of the spec).
 */
test.describe('Piano 88 - Full Lesson Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://danigb.github.io/**', (route) => route.abort());
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Piano 88' })).toBeVisible({
      timeout: 15000,
    });
  });

  test.describe('Main Screen', () => {
    test('renders with 9 octave checkboxes', async ({ page }) => {
      const octaveCheckboxes = page.getByRole('checkbox', { name: /Select octave \d/ });
      await expect(octaveCheckboxes).toHaveCount(9);
    });

    test('only octave 4 is checked by default', async ({ page }) => {
      for (let octave = 0; octave <= 8; octave++) {
        const checkbox = page.getByRole('checkbox', { name: `Select octave ${octave}` });
        if (octave === 4) {
          await expect(checkbox).toBeChecked();
        } else {
          await expect(checkbox).not.toBeChecked();
        }
      }
    });

    test('toggle settings work and have correct defaults', async ({ page }) => {
      const sharpsFlatsToggle = page.getByRole('switch', { name: 'Include sharps and flats' });
      const audioToggle = page.getByRole('switch', { name: 'Enable audio' });
      const showCorrectToggle = page.getByRole('switch', {
        name: 'Show correct answer after wrong answer',
      });
      const staffToggle = page.getByRole('switch', { name: 'Show visual staff with note' });
      const micToggle = page.getByRole('switch', { name: 'Use microphone for note detection' });

      // Defaults: sharps/flats OFF, audio ON, show answer OFF, staff ON, mic OFF
      await expect(sharpsFlatsToggle).toHaveAttribute('data-state', 'unchecked');
      await expect(audioToggle).toHaveAttribute('data-state', 'checked');
      await expect(showCorrectToggle).toHaveAttribute('data-state', 'unchecked');
      await expect(staffToggle).toHaveAttribute('data-state', 'checked');
      await expect(micToggle).toHaveAttribute('data-state', 'unchecked');

      // Toggle each non-mic switch and verify state change (the mic toggle
      // triggers a browser permission request, covered by unit tests instead)
      await sharpsFlatsToggle.click();
      await expect(sharpsFlatsToggle).toHaveAttribute('data-state', 'checked');

      await audioToggle.click();
      await expect(audioToggle).toHaveAttribute('data-state', 'unchecked');

      await showCorrectToggle.click();
      await expect(showCorrectToggle).toHaveAttribute('data-state', 'checked');
    });

    test('start button is disabled when no octaves are selected', async ({ page }) => {
      const startButton = page.getByRole('button', { name: 'Start Lesson' });

      await expect(startButton).toBeEnabled();

      const octave4Checkbox = page.getByRole('checkbox', { name: 'Select octave 4' });
      await octave4Checkbox.click();
      await expect(octave4Checkbox).not.toBeChecked();

      await expect(startButton).toBeDisabled();
      await expect(page.getByText('Select at least one octave to start')).toBeVisible();
    });

    test('start button is enabled when octave is selected', async ({ page }) => {
      const startButton = page.getByRole('button', { name: 'Start Lesson' });

      await expect(startButton).toBeEnabled();

      await page.getByRole('checkbox', { name: 'Select octave 4' }).click();
      await expect(startButton).toBeDisabled();

      await page.getByRole('checkbox', { name: 'Select octave 3' }).click();
      await expect(startButton).toBeEnabled();
    });

    test('clicking Start navigates to lesson screen', async ({ page }) => {
      await page.getByRole('button', { name: 'Start Lesson' }).click();

      await expect(page.getByRole('button', { name: 'Stop Lesson' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Start Lesson' })).not.toBeVisible();
    });
  });

  test.describe('Lesson Screen', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: 'Start Lesson' }).click();
      await expect(page.getByRole('button', { name: 'Stop Lesson' })).toBeVisible();
    });

    test('staff notation renders (VexFlow SVG present)', async ({ page }) => {
      const staffSvg = page.locator('svg');
      await expect(staffSvg.first()).toBeVisible();

      // VexFlow creates elements with class names starting with 'vf-'
      const vexflowElements = page.locator('[class^="vf-"]');
      await expect(vexflowElements.first()).toBeVisible({ timeout: 5000 });
    });

    test('3D keyboard renders (canvas present, 3:1 aspect)', async ({ page }) => {
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();

      // The keyboard is responsive with a locked 3:1 aspect ratio. Poll:
      // until styles land, a canvas reports its intrinsic 300x150 size.
      await expect(async () => {
        const box = await canvas.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width / box!.height).toBeGreaterThan(2.9);
        expect(box!.width / box!.height).toBeLessThan(3.1);
      }).toPass({ timeout: 15000 });
    });

    test('shows the audio-unavailable notice when samples fail to load', async ({ page }) => {
      // Sample loading is blocked in beforeEach, so the spec's error-handling
      // notice must appear once the aborted fetches settle.
      await expect(page.getByTestId('audio-unavailable-notice')).toBeVisible({
        timeout: 15000,
      });
      await expect(page.getByText('Audio unavailable')).toBeVisible();
    });

    test('answering records a verdict and a miss raises the Boo! swarm', async ({ page }) => {
      const overlay = page.getByTestId('feedback-overlay');
      await expect(overlay).toHaveAttribute('data-feedback', 'none');

      // The camera looks at the keyboard's center, so the canvas center lands
      // on the F key. The displayed note is random, so F is usually wrong;
      // answer until a miss occurs (bounded).
      let verdict = '';
      for (let i = 0; i < 6 && verdict !== 'incorrect'; i++) {
        verdict = await answerAtCenter(page);
      }
      expect(verdict).toBe('incorrect');

      // The heckling swarm is still airborne right after the wait.
      expect(await page.getByText('Boo!').count()).toBeGreaterThan(0);
    });

    test('stop button navigates to analytics screen', async ({ page }) => {
      await page.getByRole('button', { name: 'Stop Lesson' }).click();

      await expect(page.getByText('Lesson Complete')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Stop Lesson' })).not.toBeVisible();
    });
  });

  test.describe('Analytics Screen', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: 'Start Lesson' }).click();
      await expect(page.getByRole('button', { name: 'Stop Lesson' })).toBeVisible();

      // Wait for the keyboard to be interactive, answering one question, then
      // answer a few more (waiting out the feedback animation each time).
      await answerAtCenter(page);
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).not.toBeNull();
      for (let i = 0; i < 2; i++) {
        await page.mouse.click(
          canvasBox!.x + canvasBox!.width / 2 + (i === 0 ? -50 : 50),
          canvasBox!.y + canvasBox!.height / 2
        );
        await page.waitForTimeout(1200);
      }

      await page.getByRole('button', { name: 'Stop Lesson' }).click();
      await expect(page.getByText('Lesson Complete')).toBeVisible();
    });

    test('analytics shows session stats table with accuracy bars', async ({ page }) => {
      const statsTable = page.getByTestId('stats-table');
      await expect(statsTable).toBeVisible();

      await expect(page.getByRole('columnheader', { name: 'Octave' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Note' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Shown' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Correct' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Wrong' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Accuracy' })).toBeVisible();

      // At least one practiced note row with its accuracy bar
      const rows = page.locator('[data-testid^="stats-row-"]');
      expect(await rows.count()).toBeGreaterThan(0);
      const bars = page.locator('[data-testid^="accuracy-bar-"]');
      expect(await bars.count()).toBeGreaterThan(0);
    });

    test('analytics shows overall accuracy percentage', async ({ page }) => {
      await expect(page.getByTestId('overall-accuracy')).toHaveText(/\d+%/);
    });

    test('back button returns to main screen', async ({ page }) => {
      const backButton = page.getByRole('button', { name: 'Back to Main Menu' });
      await expect(backButton).toBeVisible();

      await backButton.click();

      await expect(page.getByRole('heading', { name: 'Piano 88' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Start Lesson' })).toBeVisible();
      await expect(page.getByText('Lesson Complete')).not.toBeVisible();
    });
  });

  test.describe('Full End-to-End Flow', () => {
    test('complete lesson flow: main -> lesson -> analytics -> main', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Piano 88' })).toBeVisible();
      const octave4 = page.getByRole('checkbox', { name: 'Select octave 4' });
      await expect(octave4).toBeChecked();

      await page.getByRole('button', { name: 'Start Lesson' }).click();
      await expect(page.getByRole('button', { name: 'Stop Lesson' })).toBeVisible();

      const svg = page.locator('svg');
      await expect(svg.first()).toBeVisible();
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();

      await answerAtCenter(page);

      await page.getByRole('button', { name: 'Stop Lesson' }).click();
      await expect(page.getByText('Lesson Complete')).toBeVisible();
      await expect(page.getByTestId('stats-table')).toBeVisible();

      await page.getByRole('button', { name: 'Back to Main Menu' }).click();
      await expect(page.getByRole('heading', { name: 'Piano 88' })).toBeVisible();

      // Settings survive the round trip (octave 4 still checked)
      await expect(octave4).toBeChecked();
    });
  });
});
