/*!
 * Copyright 2018 Apereo Foundation (AF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 *     http://opensource.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

define(['jquery', 'oae.core'], function($, oae) {

    return function(uid) {
        // The widget container
        var $rootel = $('#' + uid);

        // Holds the current state of the user profile as it is updated
        var profile = _.extend({}, oae.data.me);

        /**
         * Perform the export data action
         */
        var exportData = function(exportType) {
            // Disable the form
            $('#exportdata-form *', $rootel).prop('disabled', true);

            // Call the export data function
            oae.api.user.exportData(exportType, function(err, data) {
                if (!err) {
                    oae.api.util.notification(
                        oae.api.i18n.translate('__MSG__EXPORT_SUCCESS__', 'exportdata'),
                        oae.api.i18n.translate('__MSG__EXPORT_SUCCESSED__', 'exportdata'));
                } else {
                    oae.api.util.notification(
                        oae.api.i18n.translate('__MSG__EXPORT_FAIL__', 'exportdata'),
                        oae.api.i18n.translate('__MSG__EXPORT_FAILED__', 'exportdata'),
                        'error');
                }
            });

            // Avoid default form submit behavior
            return false;
        };

        /**
         * Reset the widget to its original state when the modal dialog is opened.
         */
        var setUpReset = function() {
            $('#exportdata-modal', $rootel).on('hidden.bs.modal', function (evt) {
                // Reset the form
                var $form = $('#exportdata-form', $rootel);
                $form[0].reset();
                oae.api.util.validation().clear($form);

                $('.oae-large-options-container label', $rootel).removeClass('checked');
                $('#exportdata-container div div:nth-child(1) label').addClass('checked');
            });
            // Enable the form
            $('#exportdata-form *', $rootel).prop('disabled', false);
        };

        /**
         * Apply the listeners to oae that will launch the export modal
         */
        var setUpModalListeners = function() {
            $(document).on('click', '.oae-trigger-exportdata', showModal);
            $(document).on('oae.trigger.exportdata', showModal);
        };

        /**
         * Show the export modal
         */
        var showModal = function() {
            setUpReset();
            $('#exportdata-modal', $rootel).modal('show');
        };

        /**
         * Close the export modal
         */
        var closeModal = function() {
            $('#exportdata-modal', $rootel).modal('hide');
        };

        /**
         * Bind all the action listeners needed for the user to interact with the export modal
         */
        var bindListeners = function() {
            // When the user chooses to go back, close the panel
            $rootel.on('click', '#cancel-exportdata', function() {
                closeModal();
                $(document).trigger('oae.trigger.editprofile', profile);
            });

            // When "Done" is clicked, close the modal and download datas
            $rootel.on('click', '#exportdata-export', function() {
                var formValue = $('.oae-large-options-container input[type="radio"]:checked', $rootel).val();
                exportData(formValue);
                closeModal();
            });

            // Catch changes in the export radio group
            $rootel.on('change', '#exportdata-container .oae-large-options-container input[type="radio"]', function() {
                $('.oae-large-options-container label', $rootel).removeClass('checked');
                $(this).parents('label').addClass('checked');
            });
        };

        setUpModalListeners();
        bindListeners();
    };
});
