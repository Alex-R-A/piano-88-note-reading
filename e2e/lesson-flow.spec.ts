import { test, expect } from '@playwright/test';

test.describe('Piano Note Learning App - Full Lesson Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to be fully loaded and React to mount
    await page.waitForLoadState('networkidle');
    // Wait for initial render with increased timeout
    await expect(page.getByRole('heading', { name: 'Piano Note Learning' })).toBeVisible({ timeout: 15000 });
  });

  test.describe('Main Screen', () => {
    test('renders with 9 octave checkboxes', async ({ page }) => {
      // Find all octave checkboxes by their aria-label pattern
      const octaveCheckboxes = page.getByRole('checkbox', { name: /Select octave \d/ });
      await expect(octaveCheckboxes).toHaveCount(9);
    });

    test('only octave 4 is checked by default', async ({ page }) => {
      // Check each octave checkbox state
      for (let octave = 0; octave <= 8; octave++) {
        const checkbox = page.getByRole('checkbox', { name: `Select octave ${octave}` });
        if (octave === 4) {
          await expect(checkbox).toBeChecked();
        } else {
          await expect(checkbox).not.toBeChecked();
        }
      }
    });

    test('toggle settings work', async ({ page }) => {
      // Find settings toggles by their aria-labels
      const sharpsFlatsToggle = page.getByRole('switch', { name: 'Include sharps and flats' });
      const audioToggle = page.getByRole('switch', { name: 'Enable audio' });
      const showCorrectToggle = page.getByRole('switch', { name: 'Show correct answer after wrong answer' });

      // Check default states: sharps/flats OFF, audio ON, show answer OFF
      await expect(sharpsFlatsToggle).toHaveAttribute('data-state', 'unchecked');
      await expect(audioToggle).toHaveAttribute('data-state', 'checked');
      await expect(showCorrectToggle).toHaveAttribute('data-state', 'unchecked');

      // Toggle each and verify state change
      await sharpsFlatsToggle.click();
      await expect(sharpsFlatsToggle).toHaveAttribute('data-state', 'checked');

      await audioToggle.click();
      await expect(audioToggle).toHaveAttribute('data-state', 'unchecked');

      await showCorrectToggle.click();
      await expect(showCorrectToggle).toHaveAttribute('data-state', 'checked');
    });

    test('start button is disabled when no octaves are selected', async ({ page }) => {
      const startButton = page.getByRole('button', { name: 'Start Lesson' });

      // Initially enabled (octave 4 is checked by default)
      await expect(startButton).toBeEnabled();

      // Uncheck octave 4
      const octave4Checkbox = page.getByRole('checkbox', { name: 'Select octave 4' });
      await octave4Checkbox.click();
      await expect(octave4Checkbox).not.toBeChecked();

      // Start button should now be disabled
      await expect(startButton).toBeDisabled();

      // Helper text should appear
      await expect(page.getByText('Select at least one octave to start')).toBeVisible();
    });

    test('start button is enabled when octave is selected', async ({ page }) => {
      const startButton = page.getByRole('button', { name: 'Start Lesson' });

      // Enabled by default with octave 4
      await expect(startButton).toBeEnabled();

      // Uncheck octave 4
      await page.getByRole('checkbox', { name: 'Select octave 4' }).click();
      await expect(startButton).toBeDisabled();

      // Check octave 3
      await page.getByRole('checkbox', { name: 'Select octave 3' }).click();
      await expect(startButton).toBeEnabled();
    });

    test('clicking Start navigates to lesson screen', async ({ page }) => {
      const startButton = page.getByRole('button', { name: 'Start Lesson' });
      await startButton.click();

      // Should now be on lesson screen - look for Stop Lesson button
      await expect(page.getByRole('button', { name: 'Stop Lesson' })).toBeVisible();
      // Main screen elements should not be visible
      await expect(page.getByRole('button', { name: 'Start Lesson' })).not.toBeVisible();
    });
  });

  test.describe('Lesson Screen', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to lesson screen
      await page.getByRole('button', { name: 'Start Lesson' }).click();
      await expect(page.getByRole('button', { name: 'Stop Lesson' })).toBeVisible();
    });

    test('staff notation renders (VexFlow SVG present)', async ({ page }) => {
      // VexFlow renders an SVG element
      const staffSvg = page.locator('svg');
      await expect(staffSvg.first()).toBeVisible();

      // Check for VexFlow-specific elements (staff lines, clef, note)
      // VexFlow creates elements with class names starting with 'vf-'
      const vexflowElements = page.locator('[class^="vf-"]');
      // At minimum, we should have some VexFlow elements
      await expect(vexflowElements.first()).toBeVisible({ timeout: 5000 });
    });

    test('3D keyboard renders (canvas present)', async ({ page }) => {
      // R3F renders to a canvas element
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();

      // Verify canvas has proper dimensions (600x250 per component)
      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBe(600);
      expect(box!.height).toBe(250);
    });

    test('clicking a key triggers feedback (background color change)', async ({ page }) => {
      // Get the feedback overlay element
      const overlay = page.getByTestId('feedback-overlay');
      await expect(overlay).toBeVisible();

      // Initial state should have transparent background
      const initialBgColor = await overlay.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      // Transparent or rgba(0,0,0,0)
      expect(initialBgColor).toMatch(/rgba?\(0,\s*0,\s*0,?\s*0?\)/);

      // Click on the canvas (center of keyboard)
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).not.toBeNull();

      // Click in the center of the canvas where keys should be
      await page.mouse.click(
        canvasBox!.x + canvasBox!.width / 2,
        canvasBox!.y + canvasBox!.height / 2
      );

      // Wait a moment for the click to be processed
      await page.waitForTimeout(100);

      // Check that feedback overlay shows a color (either green or red)
      const afterClickBgColor = await overlay.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should have changed to either green or red (not transparent)
      // Green: rgba(34, 197, 94, 0.3) or Red: rgba(239, 68, 68, 0.3)
      const isGreen = afterClickBgColor.includes('34') && afterClickBgColor.includes('197');
      const isRed = afterClickBgColor.includes('239') && afterClickBgColor.includes('68');
      expect(isGreen || isRed).toBe(true);
    });

    test('stop button navigates to analytics screen', async ({ page }) => {
      const stopButton = page.getByRole('button', { name: 'Stop Lesson' });
      await stopButton.click();

      // Should now be on analytics screen - look for "Session Complete!" heading
      await expect(page.getByText('Session Complete!')).toBeVisible();
      // Stop button should no longer be visible
      await expect(page.getByRole('button', { name: 'Stop Lesson' })).not.toBeVisible();
    });
  });

  test.describe('Analytics Screen', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate through to analytics screen
      await page.getByRole('button', { name: 'Start Lesson' }).click();
      await expect(page.getByRole('button', { name: 'Stop Lesson' })).toBeVisible();

      // Click on the keyboard a few times to generate some stats
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).not.toBeNull();

      // Make a few clicks with delays for feedback to complete
      for (let i = 0; i < 3; i++) {
        await page.mouse.click(
          canvasBox!.x + canvasBox!.width / 2 + (i - 1) * 50,
          canvasBox!.y + canvasBox!.height / 2
        );
        await page.waitForTimeout(1200); // Wait for feedback animation
      }

      // Navigate to analytics
      await page.getByRole('button', { name: 'Stop Lesson' }).click();
      await expect(page.getByText('Session Complete!')).toBeVisible();
    });

    test('analytics shows session stats table', async ({ page }) => {
      // Check for the stats table
      const statsTable = page.getByTestId('stats-table');
      await expect(statsTable).toBeVisible();

      // Table should have headers
      await expect(page.getByRole('columnheader', { name: 'Note' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Times Shown' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Correct' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Accuracy' })).toBeVisible();
    });

    test('analytics shows overall accuracy percentage', async ({ page }) => {
      // Check for overall accuracy display (large percentage)
      const accuracyText = page.getByText(/\d+%/);
      await expect(accuracyText.first()).toBeVisible();
    });

    test('back button returns to main screen', async ({ page }) => {
      const backButton = page.getByRole('button', { name: 'Back to Main Menu' });
      await expect(backButton).toBeVisible();

      await backButton.click();

      // Should be back on main screen
      await expect(page.getByRole('heading', { name: 'Piano Note Learning' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Start Lesson' })).toBeVisible();

      // Analytics elements should be gone
      await expect(page.getByText('Session Complete!')).not.toBeVisible();
    });
  });

  test.describe('Full End-to-End Flow', () => {
    test('complete lesson flow: main -> lesson -> analytics -> main', async ({ page }) => {
      // Step 1: Verify main screen
      await expect(page.getByRole('heading', { name: 'Piano Note Learning' })).toBeVisible();
      const octave4 = page.getByRole('checkbox', { name: 'Select octave 4' });
      await expect(octave4).toBeChecked();

      // Step 2: Start lesson
      await page.getByRole('button', { name: 'Start Lesson' }).click();
      await expect(page.getByRole('button', { name: 'Stop Lesson' })).toBeVisible();

      // Step 3: Verify lesson screen elements
      // Staff SVG is present
      const svg = page.locator('svg');
      await expect(svg.first()).toBeVisible();
      // Canvas for 3D keyboard is present
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();

      // Step 4: Interact with keyboard (click to trigger at least one answer)
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).not.toBeNull();
      await page.mouse.click(
        canvasBox!.x + canvasBox!.width / 2,
        canvasBox!.y + canvasBox!.height / 2
      );
      await page.waitForTimeout(1200);

      // Step 5: Stop lesson and go to analytics
      await page.getByRole('button', { name: 'Stop Lesson' }).click();
      await expect(page.getByText('Session Complete!')).toBeVisible();
      await expect(page.getByTestId('stats-table')).toBeVisible();

      // Step 6: Return to main screen
      await page.getByRole('button', { name: 'Back to Main Menu' }).click();
      await expect(page.getByRole('heading', { name: 'Piano Note Learning' })).toBeVisible();

      // Step 7: Verify settings were preserved (octave 4 still checked)
      await expect(octave4).toBeChecked();
    });
  });
});
