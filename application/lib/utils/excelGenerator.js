// =============================================================================
// EXCEL GENERATOR UTILITY - Reusable Excel file generation
// =============================================================================

({
  /**
   * Generate Excel file for driver schedule
   * @param {Object} data - Export data
   * @param {Array} data.drivers - List of drivers
   * @param {Array} data.shifts - List of shifts
   * @param {Array} data.templates - List of shift templates
   * @param {Date} data.startDate - Start date of range
   * @param {Date} data.endDate - End date of range
   * @returns {Buffer} Excel file buffer
   */
  generateDriverScheduleExcel: ({
    drivers,
    shifts,
    templates,
    startDate,
    endDate,
  }) => {
    try {
      const XLSX = npm.xlsx;
      console.log({ XLSX });
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Generate date range (days)
      const days = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Create template lookup map (by time)
      const templateMap = new Map();
      for (const template of templates) {
        const key = `${template.start_time}-${template.end_time}`;
        templateMap.set(key, template);
      }

      // Group shifts by driver and day (only show on start day)
      const shiftsByDriverAndDay = new Map();
      for (const shift of shifts) {
        const driverId = String(shift.driver_id);
        const shiftStart = new Date(shift.start_at);
        const shiftDay = new Date(
          shiftStart.getFullYear(),
          shiftStart.getMonth(),
          shiftStart.getDate(),
        );
        const dayKey = shiftDay.toISOString().split('T')[0];
        const key = `${driverId}:${dayKey}`;

        if (!shiftsByDriverAndDay.has(key)) {
          shiftsByDriverAndDay.set(key, []);
        }
        shiftsByDriverAndDay.get(key).push(shift);
      }

      // Prepare worksheet data
      const worksheetData = [];

      // Header row 1: Day names
      const headerRow1 = ['Driver'];
      for (const day of days) {
        const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
        headerRow1.push(dayName);
      }
      worksheetData.push(headerRow1);

      // Header row 2: Dates
      const headerRow2 = ['Name'];
      for (const day of days) {
        const dateStr = day.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        headerRow2.push(dateStr);
      }
      worksheetData.push(headerRow2);

      // Data rows: One per driver
      for (const driver of drivers) {
        const row = [];
        const driverName = driver.full_name || driver.name || 'Unknown';
        const nameParts = driverName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        row.push(`${firstName} ${lastName}`.trim() || driverName);

        // Add shift cells for each day
        for (const day of days) {
          const dayKey = day.toISOString().split('T')[0];
          const key = `${driver.id}:${dayKey}`;
          const dayShifts = shiftsByDriverAndDay.get(key) || [];

          if (dayShifts.length === 0) {
            row.push('-');
          } else {
            // Use first shift if multiple (shouldn't happen, but handle it)
            const shift = dayShifts[0];
            const shiftStart = new Date(shift.start_at);
            const shiftEnd = new Date(shift.end_at);

            // Format times
            const startTime = shiftStart.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
            const endTime = shiftEnd.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });

            // Check if shift matches a template
            const shiftTimeKey = `${shift.start_time}-${shift.end_time}`;
            const matchingTemplate = templateMap.get(shiftTimeKey);

            let cellValue;
            if (matchingTemplate) {
              // Template-based shift: show label + time
              cellValue = `${matchingTemplate.name} ${startTime}-${endTime}`;
            } else {
              // Custom shift: just time
              cellValue = `${startTime}-${endTime}`;
            }

            row.push(cellValue);
          }
        }

        worksheetData.push(row);
      }

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = [{ wch: 20 }]; // Driver name column
      for (let i = 0; i < days.length; i++) {
        colWidths.push({ wch: 18 });
      }
      worksheet['!cols'] = colWidths;

      // Note: The free version of xlsx library has limited styling support
      // Colors and advanced formatting would require exceljs or xlsx-style
      // For now, we focus on correct data structure
      // Colors can be added later if we switch to exceljs library

      // Freeze first two rows and first column
      worksheet['!freeze'] = {
        xSplit: 1,
        ySplit: 2,
        topLeftCell: 'B3',
        activePane: 'bottomRight',
      };

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Driver Schedule');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return buffer;
    } catch (error) {
      if (error?.code === 'MODULE_NOT_FOUND') {
        throw new Error('xlsx package not installed. Run: npm install xlsx');
      }
      throw error;
    }
  },

  /**
   * Generate Excel file for serial numbers export
   * @param {Object} data - Export data
   * @param {Array} data.serialNumbers - List of serial numbers with enriched data
   * @param {string} data.eventId - Event ID
   * @returns {Buffer} Excel file buffer
   */
  generateSerialNumbersExcel: ({ serialNumbers, eventId }) => {
    try {
      const XLSX = npm.xlsx;

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Prepare worksheet data
      const worksheetData = [];

      // Header row
      const headers = [
        'Serial Number',
        'Status',
        'Permit Type Name',
        'Subtype Name',
        'Functional Area',
        'Company',
        'Driver Name',
        'Plate Number',
        'Permit Status',
        'Request ID',
        'Created At',
        'Assigned At',
      ];
      worksheetData.push(headers);

      // Data rows
      for (const serial of serialNumbers) {
        const row = [
          serial.serial_number || '',
          serial.status || '',
          serial.permit_type_name || '',
          serial.subtype_name || '',
          serial.functional_area || '',
          serial.company || '',
          serial.driver_name || '',
          serial.plate_number || '',
          serial.permit_status || '',
          serial.request_id || '',
          serial.created_at
            ? new Date(serial.created_at)
                .toISOString()
                .replace('T', ' ')
                .substring(0, 19)
            : '',
          serial.assigned_at
            ? new Date(serial.assigned_at)
                .toISOString()
                .replace('T', ' ')
                .substring(0, 19)
            : '',
        ];
        worksheetData.push(row);
      }

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Serial Number
        { wch: 12 }, // Status
        { wch: 25 }, // Permit Type Name
        { wch: 20 }, // Subtype Name
        { wch: 25 }, // Functional Area
        { wch: 25 }, // Company
        { wch: 20 }, // Driver Name
        { wch: 15 }, // Plate Number
        { wch: 15 }, // Permit Status
        { wch: 38 }, // Request ID (UUID)
        { wch: 20 }, // Created At
        { wch: 20 }, // Assigned At
      ];
      worksheet['!cols'] = colWidths;

      // Freeze header row
      worksheet['!freeze'] = {
        xSplit: 0,
        ySplit: 1,
        topLeftCell: 'A2',
        activePane: 'bottomLeft',
      };

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Serial Numbers');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return buffer;
    } catch (error) {
      if (error?.code === 'MODULE_NOT_FOUND') {
        throw new Error('xlsx package not installed. Run: npm install xlsx');
      }
      throw error;
    }
  },
});
