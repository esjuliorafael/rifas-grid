/* -------------------------------------------------------------------------- */
/* ESTADO DE LA APLICACIÓN                               */
/* -------------------------------------------------------------------------- */
let allRaffles = []; 
let appConfig = { autoReleaseEnabled: false, releaseHours: 24 };
let auditLog = [];
let currentRaffleIndex = null;
let currentRaffle = null;
let selectedIndices = new Set();
let currentGeneratedImage = null; 
let currentTicketFilename = "ticket.png";

/* -------------------------------------------------------------------------- */
/* INICIALIZACIÓN                               */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    loadFromServer();
    checkAutoRelease();
    setupColorSync();
});

/* -------------------------------------------------------------------------- */
/* GENERADOR DE LOGO SVG DINÁMICO                                             */
/* -------------------------------------------------------------------------- */
function getDynamicSVG(color) {
    // Nota cómo inyectamos fill="${color}" directamente en la etiqueta <svg>
    return `<svg id="Capa_1" fill="${color}" width="512" height="491.3" data-name="Capa 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 551.3 529.01">
        <path d="M370,641.46l-25.14,22.43-5.46-6.12,15.07-13.46-20.09,7.83L330,647.2l10.06-19.14L325,641.54l-5.46-6.12L344.63,613l6.45,7.24L340,642.81l23.64-8.55Z" transform="translate(-224.35 -235.5)"/>
        <path d="M376.85,681.1l-10.19-7.38-5.12,3.64-7-5,29.63-20.15,7.7,5.57L382,692.2l-7-5.1Zm2-6.37,3.85-12.44-10.57,7.57Z" transform="translate(-224.35 -235.5)"/>
        <path d="M426.05,678.77a15.14,15.14,0,0,1,3.12,8,17.3,17.3,0,0,1-1.7,8.91,17.54,17.54,0,0,1-5.65,7.07,15.07,15.07,0,0,1-8.12,2.81,19.69,19.69,0,0,1-9.32-2l-11.46-5.28L407,667.68,418.47,673A19.5,19.5,0,0,1,426.05,678.77Zm-11.53,18.84c2.28-.82,4.07-2.63,5.37-5.45a9,9,0,0,0-4.83-13.06l-3.53-1.62-8.19,17.79,3.53,1.62A9.89,9.89,0,0,0,414.52,697.61Z" transform="translate(-224.35 -235.5)"/>
        <path d="M448.23,690.89l-1.72,6.6,10.63,2.77-1.6,6.13-10.63-2.77L443,710.77l12,3.14-1.66,6.36-20-5.21,8.5-32.6,20,5.2L460.26,694Z" transform="translate(-224.35 -235.5)"/>
        <path d="M494.29,691.11l-1.7,33.66-8.2-.42,1.7-33.65Z" transform="translate(-224.35 -235.5)"/>
        <path d="M537.44,722.25l-8.17.81-15.71-19.32,2.05,20.68-8.17.81-3.33-33.53,8.17-.81L528,710.31l-2.06-20.78,8.17-.81Z" transform="translate(-224.35 -235.5)"/>
        <path d="M592.16,668.61l13.15,31-7.56,3.2-7.88-18.6,1,21.55-6.1,2.58-14.89-15.68,7.91,18.64-7.56,3.21-13.16-31,8.93-3.79,17.81,17.79-.49-25.13Z" transform="translate(-224.35 -235.5)"/>
        <path d="M608.73,649l-6.81,10.54-3.2-4.68,6.4-11.13Zm1.36,15.24,3.85,5.63,9.07-6.22,3.58,5.23-9.07,6.21,4.18,6.1,10.25-7,3.72,5.42-17,11.66-19-27.8,17-11.66,3.72,5.43Z" transform="translate(-224.35 -235.5)"/>
        <path d="M661.28,656.8l-12.11-2.62L652,665.8l-6.68,6.48-4.19-19.81-19.46-4.19,6.85-6.66,12,2.59-2.82-11.45,6.68-6.49,4.16,19.65,19.62,4.22Z" transform="translate(-224.35 -235.5)"/>
        <path d="M675.52,639.16a4.12,4.12,0,0,1-3.33-.83,4.27,4.27,0,0,1-1.71-3,5.38,5.38,0,0,1,4.27-5.56,4.23,4.23,0,0,1,3.38.88,4.1,4.1,0,0,1,1.66,3,4.88,4.88,0,0,1-1.11,3.53A5,5,0,0,1,675.52,639.16Z" transform="translate(-224.35 -235.5)"/>
        <path d="M337.36,463.81a20.36,20.36,0,0,1,7.11,1.28,17.7,17.7,0,0,1,7,4.82c14-69.17,75.26-121.41,148.49-121.41a151.62,151.62,0,0,1,133.91,80.73l.66-.07c1.31-.1,2.64-.15,4-.15a58.65,58.65,0,0,1,9.77.85,45.52,45.52,0,0,1,5.48,1.3C627.41,372.47,568.4,331.5,500,331.5c-80.53,0-148,56.78-164.6,132.41A18.38,18.38,0,0,1,337.36,463.81Z" transform="translate(-224.35 -235.5)"/>
        <path d="M663.81,529.38c-1.18.89-2.39,1.75-3.65,2.54a59.08,59.08,0,0,1-13.55,6.31C629.62,603.32,570.33,651.5,500,651.5a151.37,151.37,0,0,1-121.72-61.41,45.24,45.24,0,0,1-13.93,4.84c-1.07.18-2.14.31-3.21.41A168.45,168.45,0,0,0,500,668.5c82.43,0,151.22-59.5,165.69-137.81C665.05,530.28,664.42,529.84,663.81,529.38Z" transform="translate(-224.35 -235.5)"/>
        <path d="M760,536.18a58.52,58.52,0,0,1-10.05-1.53,32.27,32.27,0,0,1-4.63-1.56C729.06,654,625.25,747.5,500,747.5c-103.86,0-193-64.32-229.63-155.21a18.33,18.33,0,0,1-8.7,10.07,22.85,22.85,0,0,1-4.88,1.93,264.6,264.6,0,0,0,505.24-68C761.3,536.25,760.61,536.23,760,536.18Z" transform="translate(-224.35 -235.5)"/>
        <path d="M246.21,480.67a30.93,30.93,0,0,1,4.75-.38c.79,0,1.56,0,2.32.11C263.3,353.06,370.13,252.5,500,252.5c101,0,188.14,60.89,226.54,147.89a19.19,19.19,0,0,1,6.5-2.54c1.2-.23,2.72-.56,4.57-1s3.74-.75,5.64-1.08A264.57,264.57,0,0,0,236.1,482.16C239.48,481.68,242.86,481.18,246.21,480.67Z" transform="translate(-224.35 -235.5)"/>
        <path d="M255.45,585.93a2.47,2.47,0,0,1-1.34,2.33,6.37,6.37,0,0,1-2.75.77q-11.52.42-23,.48a5.75,5.75,0,0,1-2.69-.63,2.22,2.22,0,0,1-1.28-2.17,2.74,2.74,0,0,1,.64-1.8,11.12,11.12,0,0,1,1.41-1.42,17.93,17.93,0,0,0,5-5.18,26.6,26.6,0,0,0,3.06-6.65,42.11,42.11,0,0,0,1.53-7.34,64.35,64.35,0,0,0,.44-7.32q0-17.25,0-34.5,0-3.39-.26-6.09a14.33,14.33,0,0,0-1.21-4.73,10.26,10.26,0,0,0-2.8-3.55,15.23,15.23,0,0,0-5-2.53,4.93,4.93,0,0,1-1.71-1.07,2.62,2.62,0,0,1-.7-2,2.52,2.52,0,0,1,1.14-2.19,5.6,5.6,0,0,1,2.42-1q10.16-1.36,20.33-2.91a9.2,9.2,0,0,1,4.58.15,7.43,7.43,0,0,1,3.07,3.06q13.94,22.65,28,46.56Q297.61,519,311,490a12,12,0,0,1,3-4.45,11.71,11.71,0,0,1,4.59-1.8q8.88-1.86,17.77-3.83a4.36,4.36,0,0,1,2.5.18,1.94,1.94,0,0,1,1.22,2.05,4,4,0,0,1-.75,2.48,9.45,9.45,0,0,1-1.79,1.84,24.72,24.72,0,0,0-5,4.62,17.9,17.9,0,0,0-2.79,4.9,21.06,21.06,0,0,0-1.19,5.64c-.16,2.05-.24,4.31-.23,6.8q.1,23.57.2,47.13,0,3.74.29,6.72a16.68,16.68,0,0,0,1.24,5.2,11.18,11.18,0,0,0,2.83,3.91,14.78,14.78,0,0,0,5.07,2.79,5,5,0,0,1,1.79,1.25,3,3,0,0,1,.78,2.13,2.93,2.93,0,0,1-1.2,2.5,5.46,5.46,0,0,1-2.49,1.08q-18.69,2.7-37.36,4.58a4.2,4.2,0,0,1-2.43-.46,2.16,2.16,0,0,1-1.16-2.12,3.62,3.62,0,0,1,.69-2.23,6.59,6.59,0,0,1,1.72-1.65,20.16,20.16,0,0,0,5-4,15.18,15.18,0,0,0,2.8-4.55,19.28,19.28,0,0,0,1.19-5.44q.24-3,.23-6.67l-.15-36.69a6,6,0,0,0-.33-1.85,1.08,1.08,0,0,0-1.34-.83,2.27,2.27,0,0,0-1.21.7,3.91,3.91,0,0,0-.83,1.19q-11.73,24-23.48,46.78a5.15,5.15,0,0,1-4.34,3,3.66,3.66,0,0,1-3.84-1.85q-12.6-20.89-25.13-40.88A2.93,2.93,0,0,0,246,527a1.71,1.71,0,0,0-1.27-.45,1.46,1.46,0,0,0-1.28,1.32,10.09,10.09,0,0,0-.25,2q0,13.33,0,26.67a64.55,64.55,0,0,0,.46,7.34,40.22,40.22,0,0,0,1.55,7.28,25.25,25.25,0,0,0,3.08,6.51,17,17,0,0,0,5.06,5,11,11,0,0,1,1.41,1.4A2.85,2.85,0,0,1,255.45,585.93Z" transform="translate(-224.35 -235.5)"/>
        <path d="M383.15,563.87a29.8,29.8,0,0,1-9.44,10.31,30.57,30.57,0,0,1-12,5,23.35,23.35,0,0,1-8,0A15.33,15.33,0,0,1,342,569.85a23.92,23.92,0,0,1-1.84-9.79,22,22,0,0,1,2.26-10.25,28.51,28.51,0,0,1,6-7.91,37.61,37.61,0,0,1,8.36-5.88,73.61,73.61,0,0,1,9.4-4.13q4.72-1.68,9.08-2.81t7.43-1.78c0-.89,0-1.78,0-2.68,0-3.77-.09-7.13-.23-10.08a39,39,0,0,0-1-7.53,8.64,8.64,0,0,0-2.33-4.47,4.71,4.71,0,0,0-4.36-.74,10,10,0,0,0-5.56,3.07,16.56,16.56,0,0,0-3.06,5.32,46.6,46.6,0,0,0-1.76,6.35,44,44,0,0,1-1.84,6.35,17.17,17.17,0,0,1-3.05,5.25,9.29,9.29,0,0,1-5.49,2.91,8.74,8.74,0,0,1-6.67-1.21q-3-1.9-3-6.86a17,17,0,0,1,2.9-9.75,33.94,33.94,0,0,1,7.2-7.77,45.34,45.34,0,0,1,9.08-5.63,43.64,43.64,0,0,1,8.64-3.09,75.45,75.45,0,0,1,14.67-2.07,18.28,18.28,0,0,1,9.69,2.11,12.7,12.7,0,0,1,5.42,7,40.19,40.19,0,0,1,1.71,12.78q0,13.09.08,26.18,0,5.26.29,8.52a13.53,13.53,0,0,0,1.17,5,4.92,4.92,0,0,0,2.44,2.43,9.67,9.67,0,0,0,4.1.57q1.79-.07,1.8,2a5.59,5.59,0,0,1-1.85,4.09,18.86,18.86,0,0,1-4.34,3.16,30.45,30.45,0,0,1-4.86,2.11,32.12,32.12,0,0,1-3.52,1c-5,1-8.75.94-11.14-.15S383.85,567.91,383.15,563.87ZM362,553.77q0,6.78,3,9.19a7.83,7.83,0,0,0,6.67,1.74,13.92,13.92,0,0,0,7.6-4.47,12.34,12.34,0,0,0,3.49-8.8q0-8.79-.07-17.57a38.53,38.53,0,0,0-8.32,2.08,22.23,22.23,0,0,0-6.58,3.75,15.86,15.86,0,0,0-4.27,5.77A20.5,20.5,0,0,0,362,553.77Z" transform="translate(-224.35 -235.5)"/>
        <path d="M459.6,554.15a3.43,3.43,0,0,1-1.15,2.71,5.47,5.47,0,0,1-2.44,1.31q-18.76,4.2-37.51,8.18a3.91,3.91,0,0,1-2.44-.24,2.16,2.16,0,0,1-1.16-2.18,4,4,0,0,1,.76-2.5,17,17,0,0,1,1.79-2,26.88,26.88,0,0,0,5-4.86,19,19,0,0,0,2.75-5,22.49,22.49,0,0,0,1.2-5.81q.24-3.16.23-7.41,0-9.64-.05-19.27a57.14,57.14,0,0,0-.73-8.95,7.78,7.78,0,0,0-6.05-7.23,8.91,8.91,0,0,1-2-.75,2.33,2.33,0,0,1-1.8-2.3,3.74,3.74,0,0,1,2-3.35l4.87-3.2q3.08-2,6.35-4.09c2.18-1.38,4.27-2.65,6.28-3.79a20.36,20.36,0,0,1,4.81-2.15,6.61,6.61,0,0,1,4.05,0,4.23,4.23,0,0,1,2.19,2.23,11.86,11.86,0,0,1,.9,3.75c.14,1.45.2,3,.21,4.61a32,32,0,0,1,10.44-12.65,39.67,39.67,0,0,1,13.3-6,19.39,19.39,0,0,1,6.43-.43,12.45,12.45,0,0,1,5.72,2,12.18,12.18,0,0,1,4.05,4.52,15.1,15.1,0,0,1,1.55,7.17,16.59,16.59,0,0,1-2.63,9.35,11.54,11.54,0,0,1-7.26,5q-4.37,1-6.48-1.26a21.45,21.45,0,0,1-3.61-5.3,43,43,0,0,0-3.09-5.4q-1.61-2.38-5.07-1.57a12.11,12.11,0,0,0-6.87,4.3,24.25,24.25,0,0,0-4,7.6,44.24,44.24,0,0,0-1.91,9,80.5,80.5,0,0,0-.5,8.66l0,14.66q0,4.11.27,7.19a18,18,0,0,0,1.23,5.37,10.46,10.46,0,0,0,2.76,3.89,15,15,0,0,0,5,2.69,9.63,9.63,0,0,1,1.79,1.2A2.8,2.8,0,0,1,459.6,554.15Z" transform="translate(-224.35 -235.5)"/>
        <path d="M531.79,534.52a5.86,5.86,0,0,1-1.73,4.13,17.57,17.57,0,0,1-4.17,3.19,35.08,35.08,0,0,1-4.88,2.29,30.67,30.67,0,0,1-3.85,1.23,35.75,35.75,0,0,1-7.37.94,9.41,9.41,0,0,1-5.32-1.43,8.63,8.63,0,0,1-3.27-4.64,27.36,27.36,0,0,1-1.09-8.59V500.17a59.83,59.83,0,0,0-.71-9.06,8.8,8.8,0,0,0-4-6.61,9,9,0,0,0-2-.78,9.08,9.08,0,0,1-2-.78,2.52,2.52,0,0,1-1.67-2.53,3.42,3.42,0,0,1,1.93-3.2q8.92-5.49,17.87-10.9a27.3,27.3,0,0,1,2.57-1.33,13.15,13.15,0,0,1,2.7-.89,5.74,5.74,0,0,1,5.34,1.09q2,1.8,2,5.79,0,22.39,0,44.79v4.37a39.48,39.48,0,0,0,.31,5,15.89,15.89,0,0,0,1.15,4.35,4.52,4.52,0,0,0,4.49,2.94,16.67,16.67,0,0,1,2,0A2,2,0,0,1,531.79,534.52Zm-9.54-94.41a20.62,20.62,0,0,1-3.93,12.26,15.88,15.88,0,0,1-9.59,6.74,9.9,9.9,0,0,1-9.58-2.57q-3.93-3.8-3.93-10.55a21,21,0,0,1,3.92-12.33,15.79,15.79,0,0,1,9.6-6.79,9.88,9.88,0,0,1,9.59,2.63Q522.26,433.37,522.25,440.11Z" transform="translate(-224.35 -235.5)"/>
        <path d="M595.73,525.28c-.44,2.48-1.72,3.9-3.86,4.26-17.45,3-34.89,6.42-52.34,10.08a6.57,6.57,0,0,1-4.23-.48c-1.37-.63-2-2-2-4a8.48,8.48,0,0,1,.58-3,24.54,24.54,0,0,1,1.35-2.89c11.53-20.24,23.09-40.27,34.66-59.91a12.33,12.33,0,0,0,.9-1.82,5.44,5.44,0,0,0,.39-2c0-1.11-.38-1.78-1.15-2a4.85,4.85,0,0,0-2.18-.16c-3.78.64-7,1.31-9.65,2a18,18,0,0,0-12.16,9.6,60.54,60.54,0,0,0-4.45,11.27,8.28,8.28,0,0,1-1.1,2.13,2.82,2.82,0,0,1-1.74,1.19A1.63,1.63,0,0,1,537,489a2.7,2.7,0,0,1-.64-1.93,38.05,38.05,0,0,1,.39-4.52q.39-3,.91-6.31t1.1-6.41c.39-2.07.67-3.73.84-5a5.65,5.65,0,0,1,1.29-2.93,4.32,4.32,0,0,1,2.45-1.47c16.8-3.24,33.61-6.09,50.41-8.4a5.91,5.91,0,0,1,3.4.52c1.07.51,1.6,1.62,1.59,3.32a11.49,11.49,0,0,1-.52,3,14,14,0,0,1-1.17,2.94c-11.53,19.07-23.06,38.66-34.56,58.57a11.55,11.55,0,0,0-1.1,2.26,7.11,7.11,0,0,0-.45,2.45c0,1.12.33,1.81,1,2.09a4.12,4.12,0,0,0,2.31.16q6-1.17,10.45-2a22.23,22.23,0,0,0,7.83-2.93,19.41,19.41,0,0,0,6-6.25,52.41,52.41,0,0,0,5.11-11.91,7.53,7.53,0,0,1,1.09-2.06,2.62,2.62,0,0,1,1.74-1.09,1.74,1.74,0,0,1,1.67.56,2.88,2.88,0,0,1,.63,1.94,36.6,36.6,0,0,1-.4,4.41q-.39,2.92-.92,6.16c-.35,2.16-.7,4.24-1,6.26S595.9,524.05,595.73,525.28Z" transform="translate(-224.35 -235.5)"/>
        <path d="M664.34,504.65a35.59,35.59,0,0,1-12.67,13.71,40.53,40.53,0,0,1-16.62,6.11,32.81,32.81,0,0,1-14-1.05A26.78,26.78,0,0,1,610,516.81a31.42,31.42,0,0,1-7.27-11.64,45.45,45.45,0,0,1-2.58-16,52,52,0,0,1,2.76-16.89,43.81,43.81,0,0,1,7.49-13.68,38.17,38.17,0,0,1,11.27-9.34,34.25,34.25,0,0,1,14.06-4.1,40.5,40.5,0,0,1,9.87.51,26.94,26.94,0,0,1,9.41,3.45,21.63,21.63,0,0,1,7.07,6.89,19,19,0,0,1,2.77,10.66,12.76,12.76,0,0,1-2.53,7.92,8.77,8.77,0,0,1-6.73,3.59,7.65,7.65,0,0,1-6.53-2.39,11.63,11.63,0,0,1-2.79-7q-.36-3.63-.41-7.07a23.13,23.13,0,0,0-.81-6,7.47,7.47,0,0,0-2.8-4.07c-1.37-1-3.55-1.37-6.54-1.14a10.69,10.69,0,0,0-6.81,3.08,22.34,22.34,0,0,0-4.65,6.74,34.92,34.92,0,0,0-2.59,8.44,48.82,48.82,0,0,0-.8,8.34,45.32,45.32,0,0,0,1.61,12.51,29.21,29.21,0,0,0,4.9,10,20.49,20.49,0,0,0,8.05,6.31,21.47,21.47,0,0,0,10.95,1.48,27.25,27.25,0,0,0,7.63-1.87,45.3,45.3,0,0,0,7.25-3.78,5.08,5.08,0,0,1,1.92-.57,1.9,1.9,0,0,1,1.22.34,1.44,1.44,0,0,1,.57,1.26A3.91,3.91,0,0,1,664.34,504.65Z" transform="translate(-224.35 -235.5)"/>
        <path d="M709.1,509a24.08,24.08,0,0,1-9.49,8.18,30.52,30.52,0,0,1-12,3.23,25.8,25.8,0,0,1-8-.84A17.38,17.38,0,0,1,672.7,516a17.62,17.62,0,0,1-4.78-6.64,24.7,24.7,0,0,1-1.74-9.9,20.18,20.18,0,0,1,2.34-9.94,22.91,22.91,0,0,1,6.05-7A29,29,0,0,1,683,478a54.74,54.74,0,0,1,9.41-2.31,77.94,77.94,0,0,1,9.07-.85c2.89-.1,5.36-.11,7.4-.05,0-.84,0-1.67,0-2.5,0-3.52,0-6.67-.15-9.46a38.15,38.15,0,0,0-.93-7.27,10.74,10.74,0,0,0-2.28-4.77,5.91,5.91,0,0,0-4.33-1.79,7.73,7.73,0,0,0-5.56,1.57,11.32,11.32,0,0,0-3.08,4.37,37.26,37.26,0,0,0-1.82,5.7,34,34,0,0,1-1.87,5.73,13.21,13.21,0,0,1-3.09,4.48,8,8,0,0,1-5.5,1.86,9.93,9.93,0,0,1-6.65-2.26q-2.93-2.34-2.91-7.23a14.51,14.51,0,0,1,3-9.12,24.19,24.19,0,0,1,7.26-6.21,31.77,31.77,0,0,1,9.08-3.45,34.79,34.79,0,0,1,8.63-.87,68,68,0,0,1,14.59,2,24.49,24.49,0,0,1,9.61,4.71,17.65,17.65,0,0,1,5.32,8,37.71,37.71,0,0,1,1.62,12q0,11.82-.07,23.64c0,3.17.06,5.76.23,7.75a13.44,13.44,0,0,0,1.13,4.8,6.57,6.57,0,0,0,2.41,2.73,12.7,12.7,0,0,0,4.08,1.44,2,2,0,0,1,1.78,2.23,3.69,3.69,0,0,1-1.86,3.22,15,15,0,0,1-4.34,1.89,29.21,29.21,0,0,1-4.85.91,34.46,34.46,0,0,1-3.51.23c-5-.06-8.72-.74-11.1-2.16S709.76,512.88,709.1,509Zm-21-13q0,6.53,2.9,9.26a9.1,9.1,0,0,0,6.63,2.63,12.27,12.27,0,0,0,7.62-3,9.36,9.36,0,0,0,3.54-7.59l.06-16.4a34.83,34.83,0,0,0-8.3.23,17.73,17.73,0,0,0-6.59,2.31,11.69,11.69,0,0,0-4.3,4.79A17.35,17.35,0,0,0,688.07,496Z" transform="translate(-224.35 -235.5)"/>
        <path d="M775.65,515.21a3.18,3.18,0,0,1-1.72,2.83,12.51,12.51,0,0,1-4.13,1.53,33.41,33.41,0,0,1-4.84.63,35.51,35.51,0,0,1-3.82,0,44.12,44.12,0,0,1-7.32-1.09,13.29,13.29,0,0,1-5.28-2.56,10.63,10.63,0,0,1-3.24-4.77,23.25,23.25,0,0,1-1.07-7.81q.07-33.71.16-67.43a48.72,48.72,0,0,0-.68-7.92,12.21,12.21,0,0,0-3.73-7.07,8.79,8.79,0,0,0-2.09-1.53,13.38,13.38,0,0,1-2.09-1.4c-.42-.42-.82-.84-1.2-1.25a2.25,2.25,0,0,1-.57-1.58,2.16,2.16,0,0,1,2-2.26c1.27-.25,2.9-.6,4.89-1s4.06-.82,6.21-1.17,4.22-.62,6.2-.79a17,17,0,0,1,4.87.16,10.82,10.82,0,0,1,5.56,3.06,8.19,8.19,0,0,1,2.26,6L766,496.46v3.77a29.06,29.06,0,0,0,.31,4.31,15.81,15.81,0,0,0,1.14,4,5.83,5.83,0,0,0,2.48,2.84,8.79,8.79,0,0,0,2,.91c.64.2,1.29.42,2,.66A2.24,2.24,0,0,1,775.65,515.21Z" transform="translate(-224.35 -235.5)"/>
        <path d="M377,359.62l-7.41,8.05-32.79-5.29,20.4,18.76-7.41,8.05-33.07-30.42,7.42-8,32.88,5.38-20.49-18.85L344,329.2Z" transform="translate(-224.35 -235.5)"/>
        <path d="M410.14,328.41l-14.5,8.43,1.67,8.21-9.91,5.76-8.52-47,10.95-6.37,36.64,30.67-10,5.82Zm-6.68-5.89L390.38,311.1l3.51,17Z" transform="translate(-224.35 -235.5)"/>
        <path d="M466.3,270.84l-4.61,47.45L448.4,321.6l-26.32-39.75L433.39,279l19,30.23,2.68-35.62Z" transform="translate(-224.35 -235.5)"/>
        <path d="M515.37,307l-16.76-.6-3,7.84-11.45-.41L502,269.46l12.66.45,14.65,45.48L517.77,315Zm-2.51-8.54-5-16.64L501.79,298Z" transform="translate(-224.35 -235.5)"/>
        <path d="M582.79,284.42l-9.26,29.16q-2.14,6.78-7.12,9.22t-11.44.4q-6.78-2.15-9.64-7.29t-.62-12.22l10.37,3.3a6.69,6.69,0,0,0-.19,4.4,4,4,0,0,0,2.73,2.38,3.84,3.84,0,0,0,3.32-.29,5.55,5.55,0,0,0,2.16-3.21l9.25-29.16Z" transform="translate(-224.35 -235.5)"/>
        <path d="M612,342l-14.08-9.11-6.57,5.2-9.61-6.23L619.8,303l10.64,6.89-10.77,46.55-9.73-6.3Zm2.23-8.62,4.26-16.83-13.56,10.81Z" transform="translate(-224.35 -235.5)"/>
        <path d="M634.56,370.33a14.33,14.33,0,0,1-.58-7.82,12.94,12.94,0,0,1,4-6.84l7.71,8.73a5.21,5.21,0,0,0-.16,7.57,6,6,0,0,0,3.38,2.13,3.76,3.76,0,0,0,3.26-1,3.69,3.69,0,0,0,1.32-2.66,9,9,0,0,0-.47-3.25,44.24,44.24,0,0,0-1.87-4.54,50.14,50.14,0,0,1-2.69-7.11,13.21,13.21,0,0,1-.16-6.17,11.09,11.09,0,0,1,3.83-6,11.74,11.74,0,0,1,10.37-3.09q5.67,1.05,10.5,6.52t5.25,11.33a12.73,12.73,0,0,1-4.19,10.19l-7.84-8.88a4.62,4.62,0,0,0,1.51-3.47,5.63,5.63,0,0,0-1.56-3.65,4.73,4.73,0,0,0-2.91-1.7,4.07,4.07,0,0,0-4.27,4.88,33.31,33.31,0,0,0,2.26,6.53,58.45,58.45,0,0,1,2.57,7.17,13.5,13.5,0,0,1,.19,6.11,10.52,10.52,0,0,1-3.63,5.85,13,13,0,0,1-6.53,3.15,13.63,13.63,0,0,1-7.49-.95A19.41,19.41,0,0,1,639.2,378,23.26,23.26,0,0,1,634.56,370.33Z" transform="translate(-224.35 -235.5)"/>
    </svg>`;
}

/* -------------------------------------------------------------------------- */
/* UTILIDAD: SINCRONIZACIÓN DE COLORES */
/* -------------------------------------------------------------------------- */
function setupColorSync() {
    syncInputs('r-color', 'r-color-picker');
    syncInputs('edit-color', 'edit-color-picker');
}

function syncInputs(textId, pickerId) {
    const textInput = document.getElementById(textId);
    const pickerInput = document.getElementById(pickerId);
    if (!textInput || !pickerInput) return;

    textInput.addEventListener('input', () => {
        const val = textInput.value;
        if (/^#[0-9A-F]{6}$/i.test(val)) pickerInput.value = val;
    });
    pickerInput.addEventListener('input', () => {
        textInput.value = pickerInput.value;
    });
}

function applyTheme(colorHex) {
    const root = document.documentElement;
    const mainColor = colorHex || '#2563eb';
    
    // Calcular un tono más oscuro para el degradado del boleto Pagado
    let r = parseInt(mainColor.substring(1,3), 16);
    let g = parseInt(mainColor.substring(3,5), 16);
    let b = parseInt(mainColor.substring(5,7), 16);
    let darkColor = `rgb(${Math.floor(r*0.6)}, ${Math.floor(g*0.6)}, ${Math.floor(b*0.6)})`;

    // 1. Aplicar variables de CSS generales
    root.style.setProperty('--primary-color', mainColor);
    root.style.setProperty('--primary-light', hexToRgba(mainColor, 0.24));
    root.style.setProperty('--primary-dark', darkColor);

    // 2. Generar y aplicar el logo SVG dinámico para html2canvas
    const logoImg = document.getElementById('dynamic-logo-img');
    if (logoImg) {
        // Obtenemos el texto SVG con el color inyectado
        const coloredSvgText = getDynamicSVG(mainColor);
        
        // Lo codificamos en Base64. Esto crea una URI de datos totalmente válida y segura 
        // que html2canvas leerá como si fuera un PNG real.
        const base64Svg = btoa(unescape(encodeURIComponent(coloredSvgText)));
        
        // Se lo asignamos al src de la imagen normal
        logoImg.src = `data:image/svg+xml;base64,${base64Svg}`;
    }
}

function hexToRgba(hex, alpha) {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3) c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return '#eff6ff';
}

/* -------------------------------------------------------------------------- */
/* NAVEGACIÓN                                  */
/* -------------------------------------------------------------------------- */
function showView(viewName) {
    ['home', 'create', 'manage', 'orders', 'settings', 'audit'].forEach(v => {
        const el = document.getElementById('view-' + v);
        if(el) el.classList.add('hidden');
    });
    
    const target = document.getElementById('view-' + viewName);
    if(target) target.classList.remove('hidden');
    
    if (viewName === 'home') {
        renderHomeList();
        applyTheme('#2563eb');
    }

    if (viewName === 'settings') renderSettings();
    if (viewName === 'audit') renderAudit();
}

/* -------------------------------------------------------------------------- */
/* BACKEND                                         */
/* -------------------------------------------------------------------------- */
async function saveToServer() {
    if (currentRaffleIndex !== null && currentRaffle) {
        allRaffles[currentRaffleIndex] = currentRaffle;
    }
    
    // Empaquetamos todo en el nuevo formato global
    const payload = {
        config: appConfig,
        auditLog: auditLog,
        raffles: allRaffles
    };

    try { 
        await fetch('backend.php', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload) 
        }); 
    } catch(e) { console.error("Error guardando:", e); }
}

async function loadFromServer() {
    try {
        const res = await fetch('backend.php');
        let data = await res.json();
        
        // Lógica de migración: Si la data es un array directo (versión vieja de tu papá)
        if (Array.isArray(data)) {
            allRaffles = data;
            appConfig = { autoReleaseEnabled: false, releaseHours: 24 };
            auditLog = [];
            saveToServer(); // Rescribimos el archivo JSON a la nueva estructura automáticamente
        } 
        // Si ya tiene la estructura nueva
        else if (data && data.raffles) {
            allRaffles = data.raffles;
            appConfig = data.config || { autoReleaseEnabled: false, releaseHours: 24 };
            auditLog = data.auditLog || [];
        } 
        // Caso de emergencia si el JSON está malformado
        else {
            allRaffles = data.tickets ? [data] : [];
            appConfig = { autoReleaseEnabled: false, releaseHours: 24 };
            auditLog = [];
        }
        
        renderHomeList();
        
        // TODO: Aquí llamaremos a la función checkAutoRelease() más adelante

    } catch(e) { 
        console.log("Error de carga:", e);
        allRaffles = [];
    }
}

/* -------------------------------------------------------------------------- */
/* RENDER HOME                                     */
/* -------------------------------------------------------------------------- */
function renderHomeList() {
    const listDiv = document.getElementById('raffles-list');
    const container = document.getElementById('existing-raffles-container');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    if (allRaffles.length > 0) {
        if(container) container.classList.remove('hidden');
        
        allRaffles.forEach((raffle, index) => {
            const total = raffle.tickets.length;
            const taken = raffle.tickets.filter(t => t.status !== 'available').length;
            const progress = Math.round((taken / total) * 100);
            const rColor = raffle.themeColor || '#2563eb';

            const card = document.createElement('div');
            card.className = 'raffle-summary-card';
            card.style.borderLeft = `5px solid ${rColor}`; 

            card.innerHTML = `
                <div onclick="selectRaffle(${index})">
                    <h4 class="raffle-summary-title">${raffle.title}</h4>
                    <p class="raffle-summary-info">${total} boletos - $${raffle.cost} c/u</p>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${progress}%; background-color: ${rColor};"></div>
                    </div>
                    <p class="progress-text">${progress}% Ocupado</p>
                </div>
                <button onclick="deleteRaffle(${index})" class="btn-delete-mini" title="Borrar Rifa">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            `;
            listDiv.appendChild(card);
        });
    } else {
        if(container) container.classList.add('hidden');
    }
}

function selectRaffle(index) {
    currentRaffleIndex = index;
    currentRaffle = allRaffles[index];
    selectedIndices.clear();
    applyTheme(currentRaffle.themeColor);
    renderGrid();
    updateStats();
    showView('manage');
}

function deleteRaffle(index) {
    if (!confirm("¿Borrar esta rifa? No hay vuelta atrás.")) return;
    allRaffles.splice(index, 1);
    if (currentRaffleIndex === index) { currentRaffleIndex = null; currentRaffle = null; }
    saveToServer();
    renderHomeList();
}

/* -------------------------------------------------------------------------- */
/* CREAR / EDITAR (LÓGICA MATEMÁTICA CORREGIDA)    */
/* -------------------------------------------------------------------------- */
function handleCreateRaffle(e) {
    e.preventDefault();
    const title = document.getElementById('r-title').value;
    const prizes = document.getElementById('r-prizes').value;
    const cost = parseInt(document.getElementById('r-cost').value);
    const quantity = parseInt(document.getElementById('r-quantity').value);
    const mode = document.querySelector('input[name="r-mode"]:checked').value;
    const themeColor = document.getElementById('r-color').value;

    let tickets = [];

    // --- PREPARACIÓN PARA MODO ALEATORIO (BOLSA DE NÚMEROS) ---
    let randomPool = [];
    if (mode === 'random') {
        if (quantity === 33) {
            // Rango 34-99 (Sin 00)
            for (let j = 34; j <= 99; j++) randomPool.push(j.toString().padStart(2, '0'));
        } else if (quantity === 25) {
            // Rango 26-99 + 00
            for (let j = 26; j <= 99; j++) randomPool.push(j.toString().padStart(2, '0'));
            randomPool.push("00");
        } else if (quantity === 50) {
            // Rango 51-99 + 00
            for (let j = 51; j <= 99; j++) randomPool.push(j.toString().padStart(2, '0'));
            randomPool.push("00");
        }
        // Mezclar la bolsa
        randomPool.sort(() => Math.random() - 0.5);
    }

    // --- GENERACIÓN DE BOLETOS ---
    for (let i = 1; i <= quantity; i++) {
        let tNum = i.toString().padStart(2, '0');
        let myExtras = [];

        if (mode === 'linear') {
            // --- LÓGICA LINEAL (MATEMÁTICA) ---
            if (quantity === 33) {
                // Saltos de 33. Ej: 1 -> 34 -> 67
                myExtras.push((i + 33).toString().padStart(2, '0'));
                myExtras.push((i + 66).toString().padStart(2, '0'));
            } 
            else if (quantity === 25) {
                // Saltos de 25. Ej: 1 -> 26 -> 51 -> 76. (100 = 00)
                let e1 = i + 25;
                let e2 = i + 50;
                let e3 = i + 75;
                
                myExtras.push(e1 === 100 ? "00" : e1.toString().padStart(2, '0'));
                myExtras.push(e2 === 100 ? "00" : e2.toString().padStart(2, '0'));
                myExtras.push(e3 === 100 ? "00" : e3.toString().padStart(2, '0'));
            } 
            else if (quantity === 50) {
                // Saltos de 50. Ej: 1 -> 51. (100 = 00)
                let e1 = i + 50;
                myExtras.push(e1 === 100 ? "00" : e1.toString().padStart(2, '0'));
            }
        } else {
            // --- LÓGICA ALEATORIA (SACAR DE LA BOLSA) ---
            const chances = (quantity === 25) ? 3 : (quantity === 33) ? 2 : 1;
            for (let c = 0; c < chances; c++) {
                if (randomPool.length > 0) {
                    myExtras.push(randomPool.shift());
                }
            }
            myExtras.sort(); // Ordenar visualmente (ej. 05, 88)
        }
        
        tickets.push({ 
            number: tNum, 
            extras: myExtras, 
            status: 'available', 
            client: '', 
            phone: '', 
            date: null 
        });
    }

    const newRaffle = { title, prizes, cost, tickets, themeColor };
    allRaffles.push(newRaffle);
    selectRaffle(allRaffles.length - 1);
    saveToServer();
    e.target.reset();
    document.getElementById('r-color').value = '#2563eb';
    document.getElementById('r-color-picker').value = '#2563eb';
}

function openEditModal() {
    document.getElementById('edit-title').value = currentRaffle.title;
    document.getElementById('edit-prizes').value = currentRaffle.prizes;
    document.getElementById('edit-cost').value = currentRaffle.cost;
    
    const color = currentRaffle.themeColor || '#2563eb';
    document.getElementById('edit-color').value = color;
    document.getElementById('edit-color-picker').value = color;
    
    document.getElementById('modal-edit').classList.remove('hidden');
}

function saveEditRaffle() {
    const newTitle = document.getElementById('edit-title').value;
    const newPrizes = document.getElementById('edit-prizes').value;
    const newCost = parseInt(document.getElementById('edit-cost').value);
    const newColor = document.getElementById('edit-color').value;

    if (!newTitle || !newCost) return alert("Título y Costo requeridos");

    currentRaffle.title = newTitle;
    currentRaffle.prizes = newPrizes;
    currentRaffle.cost = newCost;
    currentRaffle.themeColor = newColor;

    applyTheme(newColor);
    saveToServer();
    renderGrid();
    updateStats();
    closeModal('modal-edit');
}

/* -------------------------------------------------------------------------- */
/* RENDER GRID                                     */
/* -------------------------------------------------------------------------- */
function renderGrid() {
    safeSetText('m-title', currentRaffle.title);
    safeSetText('m-prizes', currentRaffle.prizes);
    safeSetText('m-cost-display', '$' + currentRaffle.cost);
    
    const container = document.getElementById('tickets-container');
    if(!container) return;
    container.innerHTML = '';

    currentRaffle.tickets.forEach((t, index) => {
        const isSelected = selectedIndices.has(index);
        const card = document.createElement('div');
        let classes = 'ticket-card';
        if (t.status === 'reserved') classes += ' status-reserved';
        if (t.status === 'paid') classes += ' status-paid';
        if (isSelected) classes += ' selected';
        
        card.className = classes;
        card.onclick = () => toggleSelection(index);

        let icon = isSelected ? 'check_circle' : 'radio_button_unchecked';
        if (!isSelected && t.status === 'paid') icon = 'verified';
        if (!isSelected && t.status === 'reserved') icon = 'person';
        let statusLabel = t.status === 'available' ? 'Disponible' : (t.status === 'reserved' ? 'Apartado' : 'Pagado');
        const iconStyle = isSelected ? `color: var(--primary-color);` : (t.status === 'available' ? 'color: #d7d7d7' : '');

        card.innerHTML = `
            <div class="flex" style="justify-content: space-between;">
                <span class="ticket-number">${t.number}</span>
                <span class="material-symbols-outlined" style="font-size: 28px; ${iconStyle}">${icon}</span>
            </div>
            ${t.client ? `<div class="ticket-client">${t.client}</div>` : `<div class="ticket-status-text">${statusLabel}</div>`}
            <div style="margin-top: auto; border-top: 1px solid #eee; padding-top: 5px;">
                <small style="color: #9a9a9a; font-size: 0.8rem;">OPORTUNIDADES</small><br>
                <strong style="color: #555;">${t.extras.join(', ')}</strong>
            </div>
        `;
        container.appendChild(card);
    });
    updateActionBar();
}

/* -------------------------------------------------------------------------- */
/* LÓGICA DE ACTUALIZACIÓN Y MODALES DE ACCIÓN       */
/* -------------------------------------------------------------------------- */
let pendingBulkStatus = null;
let pendingRelatedIndices = [];
let tempPaymentData = null;

function findRelatedTickets() {
    const owners = new Set();
    const phones = new Set();
    selectedIndices.forEach(index => {
        const t = currentRaffle.tickets[index];
        if (t.client) owners.add(t.client.trim().toLowerCase());
        if (t.phone) phones.add(t.phone.trim());
    });
    const newMatches = [];
    currentRaffle.tickets.forEach((t, index) => {
        if (selectedIndices.has(index)) return; 
        const nameMatch = t.client && owners.has(t.client.trim().toLowerCase());
        const phoneMatch = t.phone && phones.has(t.phone.trim());
        if (nameMatch || phoneMatch) newMatches.push(index);
    });
    return newMatches;
}

function bulkUpdateStatus(status) {
    if (selectedIndices.size === 0) return alert("Primero selecciona al menos un boleto.");
    const relatedIndices = findRelatedTickets();

    if (relatedIndices.length > 0) {
        pendingBulkStatus = status;
        pendingRelatedIndices = relatedIndices;
        
        const count = relatedIndices.length;
        const pText = document.getElementById('cascade-text');
        if (pText) {
            pText.innerHTML = count === 1 
                ? `El sistema detectó <strong style="color: var(--primary-color); font-size: 1.3rem;">otro boleto</strong> registrado con el mismo Cliente o Teléfono:`
                : `El sistema detectó otros <strong style="color: var(--primary-color); font-size: 1.3rem;">${count} boletos</strong> registrados con el mismo Cliente o Teléfono:`;
        }

        const listDiv = document.getElementById('cascade-tickets-list');
        if (listDiv) {
            listDiv.innerHTML = '';
            relatedIndices.forEach(idx => {
                const chip = document.createElement('span');
                chip.className = 'ticket-chip chip-gray';
                chip.innerText = currentRaffle.tickets[idx].number;
                chip.style.fontSize = '1rem'; 
                listDiv.appendChild(chip);
            });
        }
        document.getElementById('modal-cascade').classList.remove('hidden');
    } else {
        executeBulkUpdate(status);
    }
}

function applyCascade(includeRelated) {
    if (includeRelated && pendingRelatedIndices.length > 0) {
        pendingRelatedIndices.forEach(idx => selectedIndices.add(idx));
        renderGrid(); 
    }
    closeModal('modal-cascade');
    setTimeout(() => {
        if (pendingBulkStatus) {
            executeBulkUpdate(pendingBulkStatus);
            pendingBulkStatus = null;
            pendingRelatedIndices = [];
        }
    }, 100);
}

function executeBulkUpdate(status) {
    const now = new Date().toISOString();

    if (status === 'paid') {
        let ticketData = { numbers: [], extras: [], total: 0, client: '' };
        let uniqueClients = new Set();
        selectedIndices.forEach(index => {
            const t = currentRaffle.tickets[index];
            if (t.client) { ticketData.client = t.client; uniqueClients.add(t.client); }
            ticketData.numbers.push(t.number);
            ticketData.extras.push(...t.extras);
            ticketData.total += currentRaffle.cost;
        });
        if (uniqueClients.size > 1 && !confirm(`OJO: Estás pagando boletos de ${uniqueClients.size} clientes diferentes.\n¿Continuar?`)) return;
        if (!ticketData.client) {
            const promptName = prompt("Ingresa el cliente para el ticket:", "Cliente Mostrador");
            if (promptName) ticketData.client = promptName; else return;
        }
        tempPaymentData = ticketData;
        safeSetText('conf-total', '$' + ticketData.total);
        safeSetText('conf-count', selectedIndices.size);
        safeSetText('conf-client', ticketData.client);
        document.getElementById('modal-confirm-pay').classList.remove('hidden');
        return; 
    }

    const actionName = status === 'available' ? 'LIBERAR' : 'APARTAR';
    if (!confirm(`¿Estás seguro de ${actionName} ${selectedIndices.size} boletos?`)) return;
    
    selectedIndices.forEach(index => {
        let currentTicket = currentRaffle.tickets[index];

        if (status === 'available' && currentTicket.status === 'reserved') {
            addToAuditLog(currentTicket, currentRaffle.title, 'Cancelación Manual');
        }

        currentTicket.status = status;
        if (status === 'available') { 
            currentTicket.client = ''; 
            currentTicket.phone = ''; 
            currentTicket.date = null; 
        } else if (status === 'reserved') {
            currentTicket.date = now; 
        }
    });
    finalizeAction();
}

function finishPaymentAction() {
    closeModal('modal-confirm-pay');
    if (!tempPaymentData) return;
    
    const now = new Date().toISOString();
    selectedIndices.forEach(index => {
        currentRaffle.tickets[index].status = 'paid';
        if (!currentRaffle.tickets[index].client) currentRaffle.tickets[index].client = tempPaymentData.client;
        if (!currentRaffle.tickets[index].date) currentRaffle.tickets[index].date = now; 
    });
    finalizeActionAndGenerateTicket(tempPaymentData, 'paid');
    tempPaymentData = null; 
}

function finalizeAction() {
    clearSelection();
    updateStats();
    renderGrid();
    saveToServer();
}

function finalizeActionAndGenerateTicket(data, type) {
    finalizeAction();
    generateTicketImage({
        numbers: data.numbers.join(', '),
        client: data.client,
        extras: data.extras,
        total: data.total
    }, type);
}

function toggleSelection(index) {
    if (selectedIndices.has(index)) selectedIndices.delete(index);
    else selectedIndices.add(index);
    renderGrid();
}

function clearSelection() { selectedIndices.clear(); renderGrid(); }

function updateActionBar() {
    const bar = document.getElementById('action-bar');
    if (!bar) return;
    if (selectedIndices.size > 0) {
        bar.classList.remove('hidden'); bar.classList.add('flex');
        safeSetText('selected-count', selectedIndices.size);
    } else {
        bar.classList.add('hidden'); bar.classList.remove('flex');
    }
}

function openReserveModal() {
    if (selectedIndices.size === 0) return alert("Selecciona boletos");
    const nums = Array.from(selectedIndices).map(i => currentRaffle.tickets[i].number).join(', ');
    safeSetText('modal-ticket-ids', nums);
    document.getElementById('input-name').value = '';
    document.getElementById('input-phone').value = '';
    document.getElementById('modal-reserve').classList.remove('hidden');
}

function closeModal(id) { const el = document.getElementById(id); if(el) el.classList.add('hidden'); }

function confirmReserve() {
    const name = document.getElementById('input-name').value;
    const phone = document.getElementById('input-phone').value;
    if (!name) return alert("Nombre obligatorio");
    
    const now = new Date().toISOString(); 
    let reservedData = { numbers: [], extras: [], total: 0, client: name };
    selectedIndices.forEach(index => {
        currentRaffle.tickets[index].status = 'reserved';
        currentRaffle.tickets[index].client = name;
        currentRaffle.tickets[index].phone = phone;
        currentRaffle.tickets[index].date = now; 
        reservedData.numbers.push(currentRaffle.tickets[index].number);
        reservedData.extras.push(...currentRaffle.tickets[index].extras);
        reservedData.total += currentRaffle.cost;
    });
    closeModal('modal-reserve');
    clearSelection();
    updateStats();
    renderGrid();
    saveToServer();
    generateTicketImage({ numbers: reservedData.numbers.join(', '), client: name, extras: reservedData.extras, total: reservedData.total }, 'pending');
}

function updateStats() {
    const counts = { available: 0, reserved: 0, paid: 0 };
    currentRaffle.tickets.forEach(t => counts[t.status]++);
    safeSetText('stat-avail', counts.available);
    safeSetText('stat-reserved', counts.reserved);
    safeSetText('stat-paid', counts.paid);
}

/* -------------------------------------------------------------------------- */
/* VISTA DE PARTICIPANTES (ÓRDENES)                                           */
/* -------------------------------------------------------------------------- */
function renderOrdersView(filter = 'all') {
    showView('orders'); 
    const tbody = document.getElementById('orders-table-body');
    const noMsg = document.getElementById('no-orders-msg');
    tbody.innerHTML = '';

    const ordersMap = new Map();
    currentRaffle.tickets.forEach(t => {
        if (t.status === 'available') return; 
        const clientKey = (t.client || 'Sin Nombre').trim() + '|' + (t.phone || '');
        if (!ordersMap.has(clientKey)) {
            ordersMap.set(clientKey, {
                name: t.client || 'Sin Nombre',
                phone: t.phone || '',
                tickets: [],
                totalDebt: 0,
                status: 'paid', 
                lastDate: t.date || null
            });
        }
        const order = ordersMap.get(clientKey);
        order.tickets.push(t.number);
        if (t.status === 'reserved') {
            order.status = 'reserved';
            order.totalDebt += currentRaffle.cost;
        } else if (t.status === 'paid') {
            order.totalDebt += currentRaffle.cost; 
        }
        if (t.date && (!order.lastDate || new Date(t.date) > new Date(order.lastDate))) {
            order.lastDate = t.date;
        }
    });

    let orders = Array.from(ordersMap.values());
    orders.sort((a, b) => {
        if (a.status === 'reserved' && b.status === 'paid') return -1;
        if (a.status === 'paid' && b.status === 'reserved') return 1;
        const dateA = a.lastDate ? new Date(a.lastDate) : new Date(0);
        const dateB = b.lastDate ? new Date(b.lastDate) : new Date(0);
        return dateB - dateA;
    });

    if (filter === 'reserved') orders = orders.filter(o => o.status === 'reserved');

    if (orders.length === 0) {
        noMsg.classList.remove('hidden');
        return;
    }
    noMsg.classList.add('hidden');

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #f1f5f9';
        const dateStr = order.lastDate 
            ? new Date(order.lastDate).toLocaleDateString('es-MX', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})
            : 'N/D';
        const ticketsHtml = order.tickets.map(n => `<span class="ticket-chip chip-gray" style="font-size:0.8rem; padding:2px 6px;">${n}</span>`).join('');
        const isPending = order.status === 'reserved';
        const statusBadge = isPending 
            ? `<span style="background:#fefce8; color:#ca8a04; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.8rem;">PENDIENTE</span>`
            : `<span style="background:#f0fdf4; color:#16a34a; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.8rem;">PAGADO</span>`;
        
        // Escapamos comillas simples para evitar errores en el HTML onClick
        const safeName = order.name.replace(/'/g, "\\'");
        const safePhone = (order.phone || '').replace(/'/g, "\\'");

        let actions = `<div style="display:flex; gap:5px; justify-content:center;">`;
        
        // Botón WhatsApp
        if (order.phone) {
            actions += `
                <button onclick="sendWhatsAppReminder('${safePhone}', '${safeName}', '${order.tickets.join(', ')}', ${order.totalDebt}, '${isPending ? 'debt' : 'thanks'}')" 
                    class="btn" style="background-color: #25D366; color: white; padding: 5px 10px; font-size: 0.8rem;" title="Enviar WhatsApp">
                    <span class="material-symbols-outlined" style="font-size: 18px;">send</span>
                </button>
            `;
        } else {
            actions += `<span style="color:#cbd5e1; font-size:0.8rem; display:flex; align-items:center;">Sin Tel</span>`;
        }

        // Botón Descargar Ticket (NUEVO)
        actions += `
            <button onclick="reprintTicket('${safeName}', '${safePhone}')" class="btn btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" title="Ver Ticket">
                <span class="material-symbols-outlined" style="font-size: 18px;">confirmation_number</span>
            </button>
        `;
        
        actions += `</div>`;

        row.innerHTML = `
            <td style="padding: 12px;">
                <div style="font-weight:600; color:var(--text-dark);">${order.name}</div>
                <div style="font-size:0.85rem; color:#64748b;">${order.phone || '---'}</div>
            </td>
            <td style="padding: 12px; font-size:0.9rem; color:#64748b;">${dateStr}</td>
            <td style="padding: 12px;"><div style="display:flex; flex-wrap:wrap; gap:4px;">${ticketsHtml}</div></td>
            <td style="padding: 12px; font-weight:bold; color: ${isPending ? 'var(--danger-color)' : 'var(--success-color)'};">$${order.totalDebt}</td>
            <td style="padding: 12px;">${statusBadge}</td>
            <td style="padding: 12px; text-align:center;">${actions}</td>
        `;
        tbody.appendChild(row);
    });
}

// NUEVA FUNCIÓN MEJORADA: Busca por nombre y teléfono normalizados
function reprintTicket(name, phone) {
    // 1. Normalizamos los datos de búsqueda
    // Quitamos espacios extra y pasamos a minúsculas
    const searchName = name.trim().toLowerCase();
    
    // Dejamos SOLO números para el teléfono (super seguro contra espacios y guiones)
    const searchPhone = phone.replace(/\D/g, ''); 

    // 2. Filtrar boletos
    const userTickets = currentRaffle.tickets.filter(t => {
        const tName = (t.client || '').trim().toLowerCase();
        // Limpiamos también el teléfono de la base de datos
        const tPhone = (t.phone || '').replace(/\D/g, ''); 
        
        return tName === searchName && tPhone === searchPhone;
    });
    
    if (userTickets.length === 0) return alert("Error: No se encontraron boletos para este cliente.");

    // 2. Determinar estado
    const hasDebt = userTickets.some(t => t.status === 'reserved');
    const type = hasDebt ? 'pending' : 'paid';

    // 3. Datos del ticket
    const numbers = userTickets.map(t => t.number);
    const extras = userTickets.flatMap(t => t.extras); 
    const total = userTickets.length * currentRaffle.cost;

    const data = {
        numbers: numbers.join(', '),
        client: name, // Usamos el nombre original recibido para el display
        extras: extras,
        total: total
    };

    // 4. Generar
    generateTicketImage(data, type);
}

function sendWhatsAppReminder(phone, name, tickets, debt, type) {
    const cleanPhone = phone.replace(/\D/g, ''); 
    const finalPhone = cleanPhone.length === 10 ? '521' + cleanPhone : cleanPhone; 
    let message = '';
    if (type === 'debt') {
        message = `Hola *${name}*, te saludamos de Rifas Marizcal 👋.\n\nTe recordamos que tienes apartados los boletos: *${tickets}*.\nMonto pendiente: *$${debt}*.\n\nPor favor envíanos tu comprobante para asegurar tu participación. ¡Mucha suerte! 🍀`;
    } else {
        message = `Hola *${name}*, confirmamos que tus boletos *${tickets}* están 100% PAGADOS.\n\n¡Gracias por tu apoyo y mucha suerte en la rifa! 🎟️✨`;
    }
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

/* -------------------------------------------------------------------------- */
/* GENERACIÓN DE TICKET (HTML2CANVAS)                 */
/* -------------------------------------------------------------------------- */
async function generateTicketImage(data, type = 'pending') {
    const imgContainer = document.getElementById('generated-ticket-img-container');
    if (imgContainer) imgContainer.innerHTML = '<div style="padding:40px;">Generando ticket, espera...</div>';
    const modal = document.getElementById('modal-ticket');
    if (modal) modal.classList.remove('hidden');
    
    const templateId = type === 'paid' ? 'template-confirmed' : 'template-pending';
    const template = document.getElementById(templateId);
    if (!template) { alert("Error: Plantilla no encontrada."); return; }

    const dateStr = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });

    // CALCULAR NOMBRE DEL ARCHIVO PARA DESCARGA
    const statusLabel = type === 'paid' ? 'Pagado' : 'Apartado';
    const safeName = (data.client || "Cliente").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "").trim().replace(/\s+/g, "_");
    currentTicketFilename = `Ticket-${statusLabel}-${safeName}.png`;

    if (type === 'pending') {
        safeSetText('tpl-pen-cost', `$${data.total}.00`);
        safeSetText('tpl-pen-name', data.client || "Cliente");
        safeSetText('tpl-pen-date', dateStr);
        safeSetText('tpl-pen-raffle', currentRaffle.title);

        // NUEVO: Controlar el mensaje de vigencia dinámicamente
        const timeLabel = document.getElementById('tpl-pen-time');
        if (timeLabel) {
            // Si el switch está encendido, mostramos el texto con las horas exactas
            if (appConfig.autoReleaseEnabled) {
                timeLabel.innerText = `Apartado con vigencia de ${appConfig.releaseHours} horas`;
                timeLabel.style.display = 'block'; 
            } else {
                // Si está apagado, ocultamos el bloque por completo
                timeLabel.style.display = 'none';
            }
        }

        const ticketsDiv = document.getElementById('tpl-pen-tickets');
        if (ticketsDiv) {
            ticketsDiv.innerHTML = '';
            const numList = typeof data.numbers === 'string' ? data.numbers.split(', ') : data.numbers;
            numList.forEach(num => {
                const span = document.createElement('span');
                span.className = 'ticket-chip chip-gray';
                span.innerText = num;
                ticketsDiv.appendChild(span);
            });
        }
    } else {
        const clientName = data.client || "Cliente";
        const initials = clientName.substring(0, 2).toUpperCase();
        safeSetText('tpl-conf-avatar', initials);
        safeSetText('tpl-conf-name', clientName);
        safeSetText('tpl-conf-amount', `$${data.total}.00`);
        safeSetText('tpl-conf-date', dateStr); 
        safeSetText('tpl-conf-raffle', currentRaffle.title);

        const ticketsDiv = document.getElementById('tpl-conf-tickets');
        if (ticketsDiv) {
            ticketsDiv.innerHTML = '';
            const numList = typeof data.numbers === 'string' ? data.numbers.split(', ') : data.numbers;
            numList.forEach(num => {
                const div = document.createElement('div');
                div.className = 'ticket-chip chip-gray';
                div.innerText = num;
                ticketsDiv.appendChild(div);
            });
        }
        const oppsDiv = document.getElementById('tpl-conf-opps');
        if (oppsDiv) {
            oppsDiv.innerHTML = '';
            if(data.extras) {
                 const extrasArr = Array.isArray(data.extras) ? data.extras : (typeof data.extras === 'string' ? data.extras.split(' - ') : []);
                 extrasArr.forEach(op => {
                    const span = document.createElement('span');
                    span.className = 'opps-chip';
                    span.innerText = op;
                    oppsDiv.appendChild(span);
                 });
            }
        }
    }
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
        const canvas = await html2canvas(template, { scale: 2, backgroundColor: null, logging: false, useCORS: true });
        currentGeneratedImage = canvas.toDataURL("image/png");
        const img = new Image();
        img.src = currentGeneratedImage;
        img.style.width = "100%";
        img.style.maxWidth = "340px";
        img.style.borderRadius = "12px";
        img.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
        if(imgContainer) { imgContainer.innerHTML = ''; imgContainer.appendChild(img); }
    } catch (err) {
        console.error("Error generando ticket:", err);
        if(imgContainer) imgContainer.innerHTML = '<p style="color:red">Error al generar imagen.</p>';
    }
}

function downloadGeneratedTicket() {
    if (!currentGeneratedImage) return;
    const link = document.createElement('a');
    link.download = currentTicketFilename; // USAR NOMBRE PERSONALIZADO
    link.href = currentGeneratedImage;
    link.click();
}

function exportReportImage() {
    const area = document.getElementById('capture-area');
    if(!area) return;

    // 1. Obtener fecha y hora actual
    const now = new Date();
    
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Formato: DD-MM-YYYY_HH-MM (Ej: 06-01-2026_16-30)
    const timeStamp = `${day}-${month}-${year} a las ${hours}-${minutes}`;

    // 2. Limpiar el título de la rifa para que sea un nombre de archivo válido
    const safeTitle = currentRaffle.title.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "").trim().replace(/\s+/g, " ");

    html2canvas(area, {
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        // Nombre Final: Lista-Titulo_Fecha_Hora.png
        link.download = `Lista ${safeTitle} ${timeStamp}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

function safeSetText(id, text) { const el = document.getElementById(id); if (el) el.innerText = text; }

/* -------------------------------------------------------------------------- */
/* CONFIGURACIÓN Y AUDITORÍA (EL VIGILANTE)                                   */
/* -------------------------------------------------------------------------- */

function renderSettings() {
    document.getElementById('cfg-auto-release').checked = appConfig.autoReleaseEnabled;
    document.getElementById('cfg-release-hours').value = appConfig.releaseHours;
}

function saveSettings() {
    appConfig.autoReleaseEnabled = document.getElementById('cfg-auto-release').checked;
    appConfig.releaseHours = parseInt(document.getElementById('cfg-release-hours').value, 10);
    saveToServer();
    alert("Configuración guardada exitosamente.");
    showView('home');
}

function addToAuditLog(ticketData, raffleTitle, reason) {
    auditLog.unshift({
        client: ticketData.client || 'Sin Nombre',
        phone: ticketData.phone || '---',
        number: ticketData.number,
        raffle: raffleTitle,
        cancelDate: new Date().toISOString(),
        reason: reason
    });
    
    // Mantenemos solo los últimos 100 registros para que el archivo no pese demasiado
    if (auditLog.length > 100) auditLog.pop();
}

function renderAudit() {
    const tbody = document.getElementById('audit-table-body');
    const noMsg = document.getElementById('no-audit-msg');
    tbody.innerHTML = '';

    if (auditLog.length === 0) {
        noMsg.classList.remove('hidden');
        return;
    }
    
    noMsg.classList.add('hidden');
    
    auditLog.forEach(log => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #f1f5f9';
        
        const dateStr = new Date(log.cancelDate).toLocaleDateString('es-MX', {
            month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
        });

        const badgeColor = log.reason.includes('Automático') ? '#f59e0b' : '#3b82f6';

        row.innerHTML = `
            <td style="padding: 12px;">
                <div style="font-weight:600; color:var(--text-dark);">${log.client}</div>
                <div style="font-size:0.85rem; color:#64748b;">${log.phone}</div>
            </td>
            <td style="padding: 12px; font-weight:bold;">${log.number}</td>
            <td style="padding: 12px; color:#64748b; font-size:0.9rem;">${log.raffle}</td>
            <td style="padding: 12px; font-size:0.9rem;">${dateStr}</td>
            <td style="padding: 12px;">
                <span style="background:${badgeColor}20; color:${badgeColor}; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.8rem;">
                    ${log.reason}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function checkAutoRelease() {
    if (!appConfig.autoReleaseEnabled) return;

    const now = new Date();
    const hoursLimit = parseInt(appConfig.releaseHours, 10);
    let changesMade = false;

    allRaffles.forEach(raffle => {
        raffle.tickets.forEach(t => {
            if (t.status === 'reserved' && t.date) {
                const reservedDate = new Date(t.date);
                const diffMs = now - reservedDate;
                const diffHrs = diffMs / (1000 * 60 * 60);

                if (diffHrs >= hoursLimit) {
                    // 1. Mandamos a auditoría
                    addToAuditLog(t, raffle.title, 'Automático (Tiempo Expirado)');
                    
                    // 2. Liberamos el boleto
                    t.status = 'available';
                    t.client = '';
                    t.phone = '';
                    t.date = null;
                    changesMade = true;
                }
            }
        });
    });

    if (changesMade) {
        saveToServer();
        console.log("Liberación automática completada.");
    }
}