/*!
 * Copyright 2014 Apereo Foundation (AF) Licensed under the
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

casper.test.begin('Widget - Confirm Dialog', function(test) {

    /**
     * Verify that the confirm dialog elements are all present and the
     * passed in parameters are used inside of it
     */
    var verifyConfirmDialogElementsAndParameters = function() {
        // Trigger the confirm dialog to test that all elements are present
        casper.evaluate(function() {
            $(document).trigger('oae.trigger.confirmdialog', {
                'title': 'Confirm dialog title',
                'message': 'Confirm dialog message',
                'confirm': 'Confirm button',
                'confirmclass': 'btn-warning',
                'confirmed': function() {
                    // Append a paragraph to the body that enables us to check that the confirm callback
                    // was successfully executed
                    $('body').append('<p id="confirmdialog-confirmed">Confirmed dialog</p>');
                }
            });
        });

        // Verify the dialog's elements
        casper.waitForSelector('.modal-open #confirmdialog-modal', function() {
            test.assertExists('#confirmdialog-modal', 'Verify the confirm dialog opens when the `oae.trigger.confirmdialog` event is triggered');
            test.assertExists('#confirmdialog-modal .modal-header h3', 'Verify the confirm dialog has a title');
            test.assertSelectorHasText('#confirmdialog-modal .modal-header h3', 'Confirm dialog title', 'Verify the confirm dialog has the correct title as passed into the widget');
            test.assertExists('#confirmdialog-modal .modal-body p', 'Verify the confirm dialog has a message');
            test.assertSelectorHasText('#confirmdialog-modal .modal-body p', 'Confirm dialog message', 'Verify the confirm dialog has the correct message as passed into the widget');
            test.assertExists('#confirmdialog-modal .modal-footer button#confirmdialog-confirm', 'Verify the confirm dialog has a submit button');
            test.assertSelectorHasText('#confirmdialog-modal .modal-footer button#confirmdialog-confirm', 'Confirm button', 'Verify the confirm dialog has the correct submit button text as passed into the widget');
            test.assertExists('#confirmdialog-modal .modal-footer button[data-dismiss="modal"]', 'Verify the confirm dialog has a cancel button');
            // Cancel the confirm dialog
            casper.click('#confirmdialog-modal .modal-footer button[data-dismiss="modal"]');
        });

        // Verify that the dialog hasn't been confirmed and then open it to confirm it
        casper.then(function() {
            test.assertDoesntExist('#confirmdialog-confirmed', 'Verify the confirm dialog can be successfully cancelled');

            casper.evaluate(function() {
                $(document).trigger('oae.trigger.confirmdialog', {
                    'title': 'Confirm dialog title',
                    'message': 'Confirm dialog message',
                    'confirm': 'Confirm button',
                    'confirmclass': 'btn-warning',
                    'confirmed': function() {
                        // Append a paragraph to the body that enables us to check that the confirm callback
                        // was successfully executed
                        $('body').append('<p id="confirmdialog-confirmed">Confirmed dialog</p>');
                    }
                });
            });

            casper.waitForSelector('.modal-open #confirmdialog-modal', function() {
                casper.click('#confirmdialog-modal .modal-footer button#confirmdialog-confirm');
                test.assertExists('#confirmdialog-confirmed', 'Verify the confirm dialog can be successfully confirmed');
            });
        });

    };

    casper.start(configUtil.adminUI, function() {
        casper.then(function() {
            casper.echo('# Verify confirm dialog elements and parameters', 'INFO');
            userUtil.doLogIn(configUtil.adminUsername, configUtil.adminPassword);
            casper.waitForSelector('#adminheader-content', function() {
                verifyConfirmDialogElementsAndParameters();
            });
        });

        userUtil.doLogOut();
    });

    casper.run(function() {
        test.done();
    });
});
