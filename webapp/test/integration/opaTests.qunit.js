/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ysd/wa/wrkflapp/YSD_WA_WRKFLAPP/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});