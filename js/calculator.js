// BMI calculation functions
function calculateBMI(weight, height, unitSystem) {
    if (unitSystem === 'metric') {
        return (weight / ((height / 100) ** 2)).toFixed(1);
    } else {
        return ((703 * weight) / (height ** 2)).toFixed(1);
    }
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return ['Underweight', '#0DCAF0'];
    if (bmi < 25) return ['Normal', '#198754'];
    if (bmi < 30) return ['Overweight', '#FFC107'];
    return ['Obese', '#DC3545'];
}

function calculateHealthyWeightRange(height, unitSystem, gender) {
    let minBMI = 18.5;
    let maxBMI = gender === 'male' ? 25.0 : 24.5;

    if (unitSystem === 'metric') {
        height = height / 100; // Convert cm to meters
        const minWeight = (minBMI * height * height).toFixed(1);
        const maxWeight = (maxBMI * height * height).toFixed(1);
        return [minWeight, maxWeight];
    } else {
        const minWeight = ((minBMI * (height ** 2)) / 703).toFixed(1);
        const maxWeight = ((maxBMI * (height ** 2)) / 703).toFixed(1);
        return [minWeight, maxWeight];
    }
}

function calculateProteinRequirement(idealWeight) {
    return Math.round(idealWeight);
}

// Event handlers and UI updates
function updateUI() {
    const unitSystem = document.querySelector('input[name="unit-system"]:checked').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;

    // Show/hide appropriate input fields
    document.getElementById('metric-inputs').style.display = unitSystem === 'metric' ? 'block' : 'none';
    document.getElementById('imperial-inputs').style.display = unitSystem === 'imperial' ? 'block' : 'none';

    // Calculate BMI
    let weight, height;
    if (unitSystem === 'metric') {
        weight = parseFloat(document.getElementById('weight-metric').value);
        height = parseFloat(document.getElementById('height-metric').value);
    } else {
        weight = parseFloat(document.getElementById('weight-imperial').value);
        const feet = parseFloat(document.getElementById('height-feet').value);
        const inches = parseFloat(document.getElementById('height-inches').value);
        height = feet * 12 + inches;
    }

    if (weight && height) {
        // Calculate BMI
        const bmi = calculateBMI(weight, height, unitSystem);
        const [category, color] = getBMICategory(bmi);

        // Calculate healthy weight range
        const [minWeight, maxWeight] = calculateHealthyWeightRange(height, unitSystem, gender);
        const unit = unitSystem === 'metric' ? 'kg' : 'lbs';

        // Calculate protein requirement
        const idealWeight = (parseFloat(minWeight) + parseFloat(maxWeight)) / 2;
        const idealWeightLbs = unitSystem === 'metric' ? idealWeight * 2.20462 : idealWeight;
        const proteinRequirement = calculateProteinRequirement(idealWeightLbs);

        // Update UI
        document.getElementById('bmi-value').textContent = bmi;
        document.getElementById('bmi-category').textContent = category;
        document.getElementById('bmi-category').style.color = color;
        document.getElementById('weight-range').textContent = `${minWeight} - ${maxWeight} ${unit}`;
        document.getElementById('protein-intake').textContent = proteinRequirement;
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {

    // Add event listeners
    document.querySelectorAll('input[type="radio"], input[type="number"]').forEach(input => {
        input.addEventListener('change', updateUI);
    });

    // Initial UI update
    updateUI();
});
