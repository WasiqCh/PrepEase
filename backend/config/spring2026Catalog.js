export const spring2026Catalog = [
  {
    department: 'BS(CS) Morning/Evening',
    semesters: [
      {
        programSemester: 2,
        courses: [
          { courseCode: 'CSC-102', title: 'Object Oriented Programming', credits: 4, load: '3-3' },
          { courseCode: 'CSC-103', title: 'Database Systems', credits: 4, load: '3-3' },
          { courseCode: 'CSC-111', title: 'Digital Logic Design', credits: 3, load: '2-3' },
          { courseCode: 'MTH-102', title: 'Multivariable Calculus', credits: 3, load: '3-0' },
          { courseCode: 'STT-101', title: 'Probability & Statistics', credits: 3, load: '3-0' },
          { courseCode: 'SSH-302', title: 'Pakistan Studies', credits: 2, load: '2-0' },
        ],
      },
      {
        programSemester: 4,
        courses: [
          { courseCode: 'CSC-211', title: 'Computer Organization & Assembly Language', credits: 3, load: '2-3' },
          { courseCode: 'MTH-102', title: 'Linear Algebra', credits: 3, load: '3-0' },
          { courseCode: 'ENG-201', title: 'Expository Writing', credits: 3, load: '3-0' },
          { courseCode: 'IS-201', title: 'Islamic Studies/Ethics', credits: 2, load: '2-0' },
          { courseCode: 'SOS-302', title: 'Seerat Studies', credits: 2, load: '2-0' },
          { courseCode: 'CSC-251', title: 'Web Technologies', credits: 3, load: '2-3' },
          { courseCode: 'CSC-252', title: 'Advanced Programming', credits: 3, load: '2-3' },
          { courseCode: 'CSC-262', title: 'Machine Learning', credits: 3, load: '2-3' },
        ],
      },
    ],
  },
  {
    department: 'BS(SE) Morning/Evening',
    semesters: [
      {
        programSemester: 2,
        courses: [
          { courseCode: 'CSC-102', title: 'Object Oriented Programming', credits: 4, load: '3-3' },
          { courseCode: 'CSC-103', title: 'Database Systems', credits: 4, load: '3-3' },
          { courseCode: 'CSC-111', title: 'Digital Logic Design', credits: 3, load: '2-3' },
          { courseCode: 'MTH-102', title: 'Multivariable Calculus', credits: 3, load: '3-0' },
          { courseCode: 'STT-101', title: 'Probability & Statistics', credits: 3, load: '3-0' },
          { courseCode: 'SSH-302', title: 'Pakistan Studies', credits: 2, load: '2-0' },
        ],
      },
      {
        programSemester: 6,
        courses: [
          { courseCode: 'CSE-322', title: 'Software Project Management', credits: 3, load: '2-3' },
          { courseCode: 'CSE-323', title: 'Software Quality Engineering', credits: 3, load: '2-3' },
          { courseCode: 'CSE-324', title: 'Software Requirement Engineering', credits: 3, load: '2-3' },
          { courseCode: 'CSC-314', title: 'Parallel & Distributed Computing', credits: 3, load: '2-3' },
          { courseCode: 'CSC-303', title: 'Advanced Database Management Systems', credits: 3, load: '2-3' },
          { courseCode: 'CSC-313', title: 'HCI & Computer Graphics', credits: 3, load: '2-3' },
        ],
      },
    ],
  },
  {
    department: 'BETI (Morning/Afternoon)',
    semesters: [
      {
        programSemester: 2,
        courses: [
          { courseCode: 'CSC-102', title: 'Object Oriented Programming', credits: 4, load: '3-3' },
          { courseCode: 'CSC-110', title: 'Discrete Structures', credits: 3, load: '3-0' },
          { courseCode: 'CSC-206', title: 'Electronic Devices and Circuits', credits: 3, load: '2-3' },
          { courseCode: 'MTH-103', title: 'Linear Algebra', credits: 3, load: '3-0' },
          { courseCode: 'IS-201', title: 'Islamic Studies/Ethics', credits: 2, load: '2-0' },
          { courseCode: 'CSC-103', title: 'Database Systems', credits: 4, load: '3-3' },
        ],
      },
    ],
  },
];

export const flattenSpring2026Catalog = () =>
  spring2026Catalog.flatMap((departmentBlock) =>
    departmentBlock.semesters.flatMap((semesterBlock) =>
      semesterBlock.courses.map((course) => ({
        department: departmentBlock.department,
        programSemester: semesterBlock.programSemester,
        ...course,
        description: `${course.title} for ${departmentBlock.department} (Spring 2026).`,
        semester: 'Spring',
        year: 2026,
        isActive: true,
        teachers: [],
      }))
    )
  );
