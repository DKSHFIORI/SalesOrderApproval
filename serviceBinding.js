function initModel() {
	var sUrl = "/sap/opu/odata/sap/YSD_SO_WORKFLOW_APPV_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}